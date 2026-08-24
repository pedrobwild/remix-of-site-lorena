// Importa fotos do Google Drive (conta conectada do estúdio) para o bucket
// public project-images. Somente administradores autenticados.
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY = "https://connector-gateway.lovable.dev/google_drive";
const BUCKET = "project-images";

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function drive(path: string, params: Record<string, string>) {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  const GOOGLE_DRIVE_API_KEY = Deno.env.get("GOOGLE_DRIVE_API_KEY");
  if (!LOVABLE_API_KEY || !GOOGLE_DRIVE_API_KEY) {
    throw new Error("Conexão com o Google Drive não está configurada.");
  }
  const url = new URL(`${GATEWAY}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${LOVABLE_API_KEY}`,
      "X-Connection-Api-Key": GOOGLE_DRIVE_API_KEY,
    },
  });
  if (!res.ok) {
    const details = await res.text();
    console.error(`Drive request failed [${res.status}]: ${details}`);
    throw new Error(`Google Drive respondeu ${res.status}: ${details}`);
  }
  return res;
}

/** Lista TODAS as páginas de /drive/v3/files (o Drive devolve no máx. 1000 por página). */
async function driveListAll(
  params: Record<string, string>,
  innerFields: string,
): Promise<Record<string, unknown>[]> {
  const out: Record<string, unknown>[] = [];
  let pageToken: string | undefined;
  let guard = 0;
  do {
    const res = await drive("/drive/v3/files", {
      ...params,
      pageSize: "1000",
      fields: `nextPageToken,${innerFields}`,
      ...(pageToken ? { pageToken } : {}),
    });
    const data = await res.json();
    out.push(...((data.files ?? []) as Record<string, unknown>[]));
    pageToken = data.nextPageToken as string | undefined;
    guard += 1;
  } while (pageToken && guard < 20);
  return out;
}



Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // ---- auth: precisa ser admin do painel -------------------------------
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return json({ error: "Faça login no painel para importar fotos." }, 401);
    }
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: userData } = await userClient.auth.getUser();
    if (!userData?.user) {
      return json({ error: "Sessão expirada. Entre novamente no painel." }, 401);
    }
    const { data: isAdmin } = await userClient.rpc("is_admin");
    if (!isAdmin) {
      return json({ error: "Sua conta não tem permissão para importar fotos." }, 403);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action;

    // ---- listar pastas ---------------------------------------------------
    if (action === "folders") {
      const parentId: string = body?.parentId || "root";
      const search: string = (body?.search || "").trim();
      const inner = "files(id,name)";
      const common = {
        orderBy: "name",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      };

      if (search) {
        const folders = await driveListAll(
          {
            q: [
              "mimeType = 'application/vnd.google-apps.folder'",
              "trashed = false",
              `name contains '${search.replace(/'/g, "\\'")}'`,
            ].join(" and "),
            ...common,
          },
          inner,
        );
        return json({ folders: folders as unknown as { id: string; name: string }[] });
      }

      const allFolders: { id: string; name: string }[] = [];

      if (parentId === "root") {
        // Meu Drive + raiz de cada shared drive acessível.
        const [myDrive, drivesRes] = await Promise.all([
          driveListAll(
            {
              q: "mimeType = 'application/vnd.google-apps.folder' and trashed = false and 'root' in parents",
              ...common,
            },
            inner,
          ),
          drive("/drive/v3/drives", { fields: "drives(id,name)", pageSize: "100" }),
        ]);
        allFolders.push(...(myDrive as unknown as { id: string; name: string }[]));

        const drivesData = await drivesRes.json();
        const drives = (drivesData.drives ?? []) as { id: string; name: string }[];
        if (drives.length > 0) {
          const driveRoots = await Promise.all(
            drives.map((d) =>
              driveListAll(
                {
                  q: `mimeType = 'application/vnd.google-apps.folder' and trashed = false and '${d.id}' in parents`,
                  ...common,
                },
                inner,
              )
            ),
          );
          for (const r of driveRoots) {
            allFolders.push(...(r as unknown as { id: string; name: string }[]));
          }
        }
      } else {
        const folders = await driveListAll(
          {
            q: [
              "mimeType = 'application/vnd.google-apps.folder'",
              "trashed = false",
              `'${parentId.replace(/'/g, "\\'")}' in parents`,
            ].join(" and "),
            ...common,
          },
          inner,
        );
        allFolders.push(...(folders as unknown as { id: string; name: string }[]));
      }

      allFolders.sort((a, b) =>
        a.name.localeCompare(b.name, "pt-BR", { numeric: true, sensitivity: "base" }),
      );
      return json({ folders: allFolders });
    }

    // ---- listar imagens de uma pasta -------------------------------------
    if (action === "files") {
      const folderId: string = body?.folderId;
      if (!folderId) return json({ error: "folderId é obrigatório." }, 400);
      const files = (await driveListAll(
        {
          q: `'${folderId.replace(/'/g, "\\'")}' in parents and mimeType contains 'image/' and trashed = false`,
          orderBy: "name",
          supportsAllDrives: "true",
          includeItemsFromAllDrives: "true",
        },
        "files(id,name,mimeType,size,thumbnailLink,imageMediaMetadata(width,height))",
      )) as unknown as { name?: string }[];
      files.sort((a, b) =>
        (a.name ?? "").localeCompare(b.name ?? "", "pt-BR", {
          numeric: true,
          sensitivity: "base",
        }),
      );
      return json({ files });
    }


    // ---- importar arquivos para o storage --------------------------------
    if (action === "import") {
      const fileIds: string[] = Array.isArray(body?.fileIds) ? body.fileIds : [];
      const folder: string = slugify(body?.folder || "sem-slug") || "sem-slug";
      if (fileIds.length === 0) return json({ error: "Selecione ao menos uma foto." }, 400);
      if (fileIds.length > 40) return json({ error: "Importe no máximo 40 fotos por vez." }, 400);

      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      const imported: { fileId: string; name: string; url: string }[] = [];
      const failed: { fileId: string; name?: string; error: string }[] = [];

      for (const fileId of fileIds) {
        try {
          const metaRes = await drive(`/drive/v3/files/${encodeURIComponent(fileId)}`, {
            fields: "id,name,mimeType,size",
            supportsAllDrives: "true",
          });
          const meta = await metaRes.json();
          if (!String(meta.mimeType || "").startsWith("image/")) {
            failed.push({ fileId, name: meta.name, error: "Não é uma imagem." });
            continue;
          }
          const mediaRes = await drive(`/drive/v3/files/${encodeURIComponent(fileId)}`, {
            alt: "media",
            supportsAllDrives: "true",
          });
          const bytes = new Uint8Array(await mediaRes.arrayBuffer());

          const name: string = meta.name || "foto.jpg";
          const dot = name.lastIndexOf(".");
          const ext = dot >= 0 ? name.slice(dot).toLowerCase() : ".jpg";
          const base = slugify(dot >= 0 ? name.slice(0, dot) : name).slice(0, 60) || "foto";
          const path = `bewild/${folder}/${Date.now()}-${base}${ext}`;

          const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
            cacheControl: "31536000",
            upsert: false,
            contentType: meta.mimeType,
          });
          if (error) throw error;
          const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(path);
          imported.push({ fileId, name, url: pub.publicUrl });
        } catch (e) {
          failed.push({ fileId, error: e instanceof Error ? e.message : "Falha ao importar." });
        }
      }

      return json({ imported, failed });
    }

    // ---- criar um projeto a partir de UMA pasta (importação em lote) ------
    if (action === "create_from_folder") {
      const folderId: string = body?.folderId;
      const title: string = String(body?.title || "").trim();
      const rawSlug: string = slugify(String(body?.slug || title)) || "projeto";
      const sortOrder: number = Number.isFinite(body?.sortOrder) ? Number(body.sortOrder) : 0;
      const max = Math.min(Math.max(Number(body?.max) || 12, 1), 24);
      if (!folderId || !title) return json({ error: "folderId e title são obrigatórios." }, 400);

      const admin = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      );

      // slug único
      let slug = rawSlug;
      for (let i = 2; i < 50; i++) {
        const { data: exists } = await admin
          .from("projects")
          .select("id")
          .eq("slug", slug)
          .maybeSingle();
        if (!exists) break;
        slug = `${rawSlug}-${i}`;
      }

      type DriveImg = { id: string; name?: string; mimeType?: string };

      const listImages = async (parent: string): Promise<DriveImg[]> =>
        (await driveListAll(
          {
            q: `'${parent.replace(/'/g, "\\'")}' in parents and mimeType contains 'image/' and trashed = false`,
            orderBy: "name",
            supportsAllDrives: "true",
            includeItemsFromAllDrives: "true",
          },
          "files(id,name,mimeType)",
        )) as unknown as DriveImg[];

      const listSubfolders = async (parent: string): Promise<{ id: string; name?: string }[]> =>
        (await driveListAll(
          {
            q: `'${parent.replace(/'/g, "\\'")}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            orderBy: "name",
            supportsAllDrives: "true",
            includeItemsFromAllDrives: "true",
          },
          "files(id,name)",
        )) as unknown as { id: string; name?: string }[];

      // Varre a pasta do cliente e suas subpastas (até 3 níveis), dando
      // prioridade às pastas de imagens do projeto (ex.: "Imagens Projeto PNG").
      const PRIORITY = /imagens|fotos|render|projeto png/i;
      const seen = new Set<string>();
      const collected: { img: DriveImg; priority: boolean; path: string }[] = [];

      const walk = async (parent: string, depth: number, priority: boolean, path: string) => {
        if (depth > 3 || collected.length > 400) return;
        for (const img of await listImages(parent)) {
          if (seen.has(img.id)) continue;
          seen.add(img.id);
          collected.push({ img, priority, path });
        }
        const subs = await listSubfolders(parent);
        for (const s of subs) {
          const isPrio = priority || PRIORITY.test(s.name ?? "");
          await walk(s.id, depth + 1, isPrio, `${path}/${s.name ?? ""}`);
        }
      };

      await walk(folderId, 0, false, "");

      const cmp = (a: string, b: string) =>
        a.localeCompare(b, "pt-BR", { numeric: true, sensitivity: "base" });

      // pastas de imagens primeiro; depois ordem natural por caminho/nome
      collected.sort(
        (a, b) =>
          Number(b.priority) - Number(a.priority) ||
          cmp(a.path, b.path) ||
          cmp(a.img.name ?? "", b.img.name ?? ""),
      );

      const files = collected.map((c) => c.img);


      const urls: string[] = [];
      for (const f of files.slice(0, max)) {
        try {
          const mediaRes = await drive(`/drive/v3/files/${encodeURIComponent(f.id)}`, {
            alt: "media",
            supportsAllDrives: "true",
          });
          const bytes = new Uint8Array(await mediaRes.arrayBuffer());
          const name = f.name || "foto.jpg";
          const dot = name.lastIndexOf(".");
          const ext = dot >= 0 ? name.slice(dot).toLowerCase() : ".jpg";
          const base = slugify(dot >= 0 ? name.slice(0, dot) : name).slice(0, 60) || "foto";
          const path = `bewild/${slug}/${Date.now()}-${base}${ext}`;
          const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
            cacheControl: "31536000",
            upsert: false,
            contentType: f.mimeType || "image/jpeg",
          });
          if (error) throw error;
          urls.push(admin.storage.from(BUCKET).getPublicUrl(path).data.publicUrl);
        } catch (e) {
          console.error("batch upload falhou:", e);
        }
      }

      const { data: created, error: insErr } = await admin
        .from("projects")
        .insert({
          title,
          slug,
          tag: "reforma",
          cover_url: urls[0] ?? null,
          cover_alt: title,
          gallery_urls: urls.slice(1),
          published: false,
          sort_order: sortOrder,
        })
        .select("id, slug")
        .single();
      if (insErr) return json({ error: insErr.message }, 400);

      return json({ project: created, images: urls.length, totalInFolder: files.length });
    }

    return json({ error: "Ação inválida." }, 400);

  } catch (e) {
    console.error("drive-import error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
