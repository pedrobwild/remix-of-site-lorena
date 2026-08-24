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
      const clauses = [
        "mimeType = 'application/vnd.google-apps.folder'",
        "trashed = false",
      ];
      if (search) {
        clauses.push(`name contains '${search.replace(/'/g, "\\'")}'`);
      } else {
        clauses.push(`'${parentId.replace(/'/g, "\\'")}' in parents`);
      }
      const res = await drive("/drive/v3/files", {
        q: clauses.join(" and "),
        fields: "files(id,name)",
        orderBy: "name",
        pageSize: "100",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      });
      const data = await res.json();
      return json({ folders: data.files ?? [] });
    }

    // ---- listar imagens de uma pasta -------------------------------------
    if (action === "files") {
      const folderId: string = body?.folderId;
      if (!folderId) return json({ error: "folderId é obrigatório." }, 400);
      const res = await drive("/drive/v3/files", {
        q: `'${folderId.replace(/'/g, "\\'")}' in parents and mimeType contains 'image/' and trashed = false`,
        fields: "files(id,name,mimeType,size,thumbnailLink,imageMediaMetadata(width,height))",
        orderBy: "name",
        pageSize: "200",
        supportsAllDrives: "true",
        includeItemsFromAllDrives: "true",
      });
      const data = await res.json();
      return json({ files: data.files ?? [] });
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

    return json({ error: "Ação inválida." }, 400);
  } catch (e) {
    console.error("drive-import error:", e);
    return json({ error: e instanceof Error ? e.message : "Erro inesperado." }, 500);
  }
});
