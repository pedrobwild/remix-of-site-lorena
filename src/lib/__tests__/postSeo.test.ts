import { describe, it, expect } from "vitest";
import { postAuthorByline, postAuthorJsonLd, postDates, postTitleFromSlug, resolvePostAuthor } from "../postSeo";

describe("resolvePostAuthor / postAuthorJsonLd", () => {
  it("'Equipe Bewild' (ou vazio) assina como Organization", () => {
    expect(resolvePostAuthor("Equipe Bewild")).toBeNull();
    expect(resolvePostAuthor("")).toBeNull();
    expect(postAuthorJsonLd(null)).toMatchObject({ "@type": "Organization", name: "Bewild" });
    expect(postAuthorByline("Equipe Bewild")).toBe("Equipe Bewild");
  });

  it("autor conhecido vira Person com cargo e registro, mesmo na forma curta", () => {
    const full = postAuthorJsonLd("Thiago Dantas do Amor");
    expect(full).toMatchObject({ "@type": "Person", name: "Thiago Dantas do Amor", identifier: "CAU A162437-7" });
    expect(postAuthorJsonLd("thiago dantas")).toMatchObject({ name: "Thiago Dantas do Amor" });
    expect(postAuthorByline("Thiago Dantas")).toBe("Thiago Dantas do Amor · CAU A162437-7");
  });

  it("nome desconhecido vira Person só com o nome (nada inventado)", () => {
    const p = postAuthorJsonLd("Pedro Alves");
    expect(p).toMatchObject({ "@type": "Person", name: "Pedro Alves" });
    expect(p).not.toHaveProperty("identifier");
    expect(p).not.toHaveProperty("jobTitle");
    expect(postAuthorByline("Pedro Alves")).toBe("Pedro Alves");
    // "Thiago" sozinho não basta para casar o registro
    expect(postAuthorJsonLd("Thiago")).not.toHaveProperty("identifier");
  });
});

describe("postTitleFromSlug", () => {
  it("humaniza o slug e nunca devolve 'Carregando'", () => {
    expect(postTitleFromSlug("quanto-custa-reformar-studio-short-stay-sao-paulo")).toBe(
      "Quanto custa reformar studio short stay sao paulo",
    );
    expect(postTitleFromSlug("")).toBe("Conteúdo");
    expect(postTitleFromSlug(undefined)).toBe("Conteúdo");
  });
});

describe("postDates", () => {
  it("sem alteração posterior: modified = published e sem linha de atualização", () => {
    const d = postDates({ published_at: "2026-08-24T10:00:00Z", updated_at: "2026-08-24T10:00:00Z" });
    expect(d.modified).toBe("2026-08-24T10:00:00Z");
    expect(d.showUpdated).toBe(false);
  });

  it("updated_at posterior em outro dia: modified = updated_at e linha visível", () => {
    const d = postDates({ published_at: "2026-06-15T10:00:00Z", updated_at: "2026-09-22T12:00:00Z" });
    expect(d.published).toBe("2026-06-15T10:00:00Z");
    expect(d.modified).toBe("2026-09-22T12:00:00Z");
    expect(d.showUpdated).toBe(true);
  });

  it("alteração no mesmo dia da publicação não mostra a linha, mas mantém dateModified", () => {
    const d = postDates({ published_at: "2026-09-22T10:00:00Z", updated_at: "2026-09-22T18:00:00Z" });
    expect(d.modified).toBe("2026-09-22T18:00:00Z");
    expect(d.showUpdated).toBe(false);
  });

  it("updated_at anterior à publicação (rascunho antigo publicado depois) não vale como atualização", () => {
    const d = postDates({ published_at: "2026-09-22T10:00:00Z", updated_at: "2026-08-24T10:00:00Z" });
    expect(d.modified).toBe("2026-09-22T10:00:00Z");
    expect(d.showUpdated).toBe(false);
    expect(postDates(null).published).toBeNull();
  });
});
