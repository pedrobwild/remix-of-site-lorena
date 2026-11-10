/**
 * Ponto de chamada do IndexNow nos editores do painel: depois de o banco
 * confirmar o salvamento de um post ou projeto PUBLICADO, o editor chama a
 * função de servidor `notifyIndexNow` com o slug salvo; rascunho não chama, e
 * falha do aviso não impede o salvamento nem a volta para a lista.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const notifyIndexNow = vi.fn();
vi.mock("@/lib/indexNow.functions", () => ({
  notifyIndexNow: (...a: unknown[]) => notifyIndexNow(...a),
}));
const navigate = vi.fn();
vi.mock("@/lib/useHashRoute", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/useHashRoute")>()),
  navigate: (...a: unknown[]) => navigate(...a),
}));
vi.mock("@/components/admin/BewildAdminShell", () => ({
  default: ({ children, actions }: { children: ReactNode; actions?: ReactNode }) => (
    <div>
      {actions}
      {children}
    </div>
  ),
}));
vi.mock("@/components/admin/RichTextEditor", () => ({ default: () => null }));
vi.mock("@/components/admin/BewildImageField", () => ({ default: () => null }));
vi.mock("@/components/admin/BewildGalleryField", () => ({ default: () => null }));
vi.mock("@/components/admin/DriveImportDialog", () => ({ default: () => null }));
vi.mock("@/lib/uploadImage", () => ({ uploadImageGeneric: vi.fn() }));
vi.mock("@/lib/projectImageCleanup", () => ({
  cleanupRemovedProjectImages: vi.fn(async () => ({ error: null })),
  projectImageUrls: () => [],
}));

/** Linha carregada pelo editor e o que o banco devolve ao gravar. */
const db: {
  row: Record<string, unknown> | null;
  gravados: Array<{ table: string; payload: Record<string, unknown> }>;
} = {
  row: null,
  gravados: [],
};

function query(table: string) {
  let payload: Record<string, unknown> | null = null;
  const resultado = () => {
    if (payload) {
      db.gravados.push({ table, payload });
      return table === "projects"
        ? { data: [{ id: db.row?.id ?? "novo-id" }], error: null }
        : { data: { slug: payload.slug }, error: null };
    }
    return { data: db.row, error: null };
  };
  const q: Record<string, unknown> = {};
  for (const m of ["select", "eq", "order", "limit"]) q[m] = () => q;
  q.update = (p: Record<string, unknown>) => {
    payload = p;
    return q;
  };
  q.insert = (p: Record<string, unknown>) => {
    payload = p;
    return q;
  };
  q.maybeSingle = async () => resultado();
  q.single = async () => {
    const r = resultado();
    return Array.isArray(r.data) ? { data: r.data[0], error: null } : r;
  };
  q.then = (ok: (v: unknown) => unknown, fail?: (e: unknown) => unknown) =>
    Promise.resolve(resultado()).then(ok, fail);
  return q;
}

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { from: (table: string) => query(table) },
}));

import BewildPostFormPage from "@/pages/admin/BewildPostFormPage";
import BewildProjectFormPage from "@/pages/admin/BewildProjectFormPage";

function post(published: boolean) {
  return {
    id: "post-1",
    slug: "vistoria-de-entrega",
    title: "Vistoria de entrega do studio novo",
    meta_title: null,
    meta_description: null,
    og_image: null,
    focus_keyword: null,
    category: null,
    excerpt: null,
    cover_image: null,
    body: "<p>Texto</p>",
    reading_time: 1,
    author: "Equipe Bewild",
    featured: false,
    published,
    published_at: published ? "2026-11-01T12:00:00.000Z" : null,
    faq: [],
  };
}

function projeto(published: boolean) {
  return {
    id: "proj-1",
    title: "Studio no Brooklin",
    slug: "studio-brooklin",
    project_type: null,
    neighborhood: "Brooklin",
    area_m2: 25,
    duration: null,
    budget_range: null,
    summary: null,
    challenge: null,
    solution: null,
    result_text: null,
    scope: [],
    testimonial: null,
    testimonial_author: null,
    cover_url: null,
    before_image_url: null,
    after_image_url: null,
    gallery_urls: [],
    ready_gallery_urls: [],
    published,
    sort_order: 10,
  };
}

beforeEach(() => {
  notifyIndexNow.mockReset();
  notifyIndexNow.mockResolvedValue({ status: "enviado", http: 200, url: "" });
  navigate.mockReset();
  db.row = null;
  db.gravados = [];
});

describe("editor de post: aviso ao IndexNow ao salvar", () => {
  it("post publicado: grava e avisa com o slug salvo", async () => {
    db.row = post(true);
    render(<BewildPostFormPage slug="vistoria-de-entrega" />);
    fireEvent.click(await screen.findByRole("button", { name: /Salvar/ }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/admin/conteudos"));
    expect(db.gravados).toHaveLength(1);
    expect(notifyIndexNow).toHaveBeenCalledTimes(1);
    expect(notifyIndexNow).toHaveBeenCalledWith({
      data: { kind: "post", slug: "vistoria-de-entrega" },
    });
  });

  it("marcar Publicar num rascunho e salvar também avisa", async () => {
    db.row = post(false);
    render(<BewildPostFormPage slug="vistoria-de-entrega" />);
    fireEvent.click(await screen.findByRole("checkbox", { name: "Publicar" }));
    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(db.gravados[0].payload.published).toBe(true);
    expect(notifyIndexNow).toHaveBeenCalledWith({
      data: { kind: "post", slug: "vistoria-de-entrega" },
    });
  });

  it("rascunho ou despublicado: salva sem avisar", async () => {
    db.row = post(true);
    render(<BewildPostFormPage slug="vistoria-de-entrega" />);
    fireEvent.click(await screen.findByRole("checkbox", { name: "Publicar" }));
    fireEvent.click(screen.getByRole("button", { name: /Salvar/ }));
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(db.gravados[0].payload.published).toBe(false);
    expect(notifyIndexNow).not.toHaveBeenCalled();
  });

  it("falha do aviso (servidor fora, rede) não impede o salvamento", async () => {
    db.row = post(true);
    notifyIndexNow.mockRejectedValue(new Error("Failed to fetch"));
    render(<BewildPostFormPage slug="vistoria-de-entrega" />);
    fireEvent.click(await screen.findByRole("button", { name: /Salvar/ }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/admin/conteudos"));
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("erro síncrono ao montar o aviso também não impede o salvamento", async () => {
    db.row = post(true);
    notifyIndexNow.mockImplementation(() => {
      throw new Error("server fn indisponível");
    });
    render(<BewildPostFormPage slug="vistoria-de-entrega" />);
    fireEvent.click(await screen.findByRole("button", { name: /Salvar/ }));
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/admin/conteudos"));
  });
});

describe("editor de projeto: aviso ao IndexNow ao salvar", () => {
  it("Salvar e publicar: grava e avisa com o slug do projeto", async () => {
    db.row = projeto(false);
    render(<BewildProjectFormPage slug="studio-brooklin" />);
    fireEvent.click((await screen.findAllByRole("button", { name: "Salvar e publicar" }))[0]);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/admin/projetos"));
    expect(db.gravados[0].payload.published).toBe(true);
    expect(notifyIndexNow).toHaveBeenCalledTimes(1);
    expect(notifyIndexNow).toHaveBeenCalledWith({
      data: { kind: "project", slug: "studio-brooklin" },
    });
  });

  it("projeto já publicado salvo pelo 'Salvar rascunho' continua publicado e avisa", async () => {
    db.row = projeto(true);
    render(<BewildProjectFormPage slug="studio-brooklin" />);
    fireEvent.click((await screen.findAllByRole("button", { name: "Salvar rascunho" }))[0]);
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(db.gravados[0].payload.published).toBe(true);
    expect(notifyIndexNow).toHaveBeenCalledWith({
      data: { kind: "project", slug: "studio-brooklin" },
    });
  });

  it("rascunho: salva sem avisar", async () => {
    db.row = projeto(false);
    render(<BewildProjectFormPage slug="studio-brooklin" />);
    fireEvent.click((await screen.findAllByRole("button", { name: "Salvar rascunho" }))[0]);
    await waitFor(() => expect(navigate).toHaveBeenCalled());
    expect(db.gravados[0].payload.published).toBe(false);
    expect(notifyIndexNow).not.toHaveBeenCalled();
  });

  it("falha do aviso não impede o salvamento", async () => {
    db.row = projeto(true);
    notifyIndexNow.mockRejectedValue(new Error("Failed to fetch"));
    render(<BewildProjectFormPage slug="studio-brooklin" />);
    fireEvent.click((await screen.findAllByRole("button", { name: "Salvar e publicar" }))[0]);
    await waitFor(() => expect(navigate).toHaveBeenCalledWith("/admin/projetos"));
    expect(screen.queryByRole("alert")).toBeNull();
  });
});
