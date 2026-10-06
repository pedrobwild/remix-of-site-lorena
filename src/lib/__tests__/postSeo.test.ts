import { describe, it, expect } from "vitest";
import {
  authorForPage,
  authorProfileJsonLd,
  postAuthorByline,
  postAuthorHref,
  postAuthorJsonLd,
  postDates,
  postTitleFromSlug,
  resolvePostAuthor,
} from "../postSeo";

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

  it("Pedro casa pelo alias curto e ganha nome completo, página de autor e LinkedIn", () => {
    const p = postAuthorJsonLd("Pedro Alves");
    expect(p).toMatchObject({
      "@type": "Person",
      name: "Pedro Henrique Alves",
      jobTitle: "Engenheiro, cofundador e CEO da Bewild",
      url: "https://bewild.com.br/conteudos/pedro-henrique-alves-ceo-bewild",
      sameAs: [
        "https://www.linkedin.com/in/pedro-henrique-alves-872b0245",
        "https://www.allaroundworlds.com/top-list/global-business-icons-2026/pedro-henrique-alves/",
      ],
    });
    // O mesmo @id em todos os posts e na ProfilePage: o Google junta tudo numa entidade só.
    expect(p["@id"]).toBe("https://bewild.com.br/conteudos/pedro-henrique-alves-ceo-bewild#person");
    expect(p).not.toHaveProperty("identifier");
    expect(postAuthorJsonLd("pedro henrique alves")).toMatchObject({ name: "Pedro Henrique Alves" });
    expect(postAuthorByline("Pedro Alves")).toBe("Pedro Henrique Alves");
    expect(postAuthorHref("Pedro Alves")).toBe("/conteudos/pedro-henrique-alves-ceo-bewild");
    // "Pedro" sozinho não casa (poderia ser outra pessoa)
    expect(postAuthorJsonLd("Pedro")).not.toHaveProperty("jobTitle");
  });

  it("nome desconhecido vira Person só com o nome (nada inventado)", () => {
    const p = postAuthorJsonLd("Maria Souza");
    expect(p).toMatchObject({ "@type": "Person", name: "Maria Souza" });
    expect(p).not.toHaveProperty("identifier");
    expect(p).not.toHaveProperty("jobTitle");
    expect(p).not.toHaveProperty("url");
    expect(postAuthorByline("Maria Souza")).toBe("Maria Souza");
    expect(postAuthorHref("Maria Souza")).toBeNull();
    expect(postAuthorHref("Equipe Bewild")).toBeNull();
    // "Thiago" sozinho não basta para casar o registro
    expect(postAuthorJsonLd("Thiago")).not.toHaveProperty("identifier");
    // Sem página própria, sem @id (nada a consolidar)
    expect(postAuthorJsonLd("Thiago Dantas")).not.toHaveProperty("@id");
  });
});

describe("authorForPage / authorProfileJsonLd (página de autor)", () => {
  it("reconhece o post que é a página do autor e ignora os demais", () => {
    expect(authorForPage("pedro-henrique-alves-ceo-bewild")?.name).toBe("Pedro Henrique Alves");
    expect(authorForPage("o-que-e-short-stay")).toBeNull();
    expect(authorForPage(null)).toBeNull();
  });

  it("monta a ProfilePage com a Person completa, mesmo @id dos posts, foto e datas", () => {
    const person = authorForPage("pedro-henrique-alves-ceo-bewild")!;
    const page = authorProfileJsonLd(person, {
      image: "https://x/capa.jpg",
      dateCreated: "2026-10-06T08:10:48Z",
      dateModified: "2026-10-06T08:27:04Z",
    });
    expect(page).toMatchObject({
      "@type": "ProfilePage",
      dateCreated: "2026-10-06T08:10:48Z",
      dateModified: "2026-10-06T08:27:04Z",
      about: { "@id": "https://bewild.com.br/conteudos/pedro-henrique-alves-ceo-bewild#person" },
    });
    const main = page.mainEntity as Record<string, unknown>;
    expect(main).toMatchObject({
      "@type": "Person",
      "@id": "https://bewild.com.br/conteudos/pedro-henrique-alves-ceo-bewild#person",
      name: "Pedro Henrique Alves",
      jobTitle: "Engenheiro, cofundador e CEO da Bewild",
      url: "https://bewild.com.br/conteudos/pedro-henrique-alves-ceo-bewild",
      // Foto fixa do autor vence a capa do post.
      image: "https://bewild.com.br/images/imprensa/allaroundworlds-pedro.webp",
      alumniOf: { "@type": "CollegeOrUniversity", name: "Universidade de São Paulo" },
      worksFor: { "@id": "https://bewild.com.br/#org" },
    });
    expect(main.sameAs).toHaveLength(2);
  });

  it("sem foto fixa, usa a capa do post; sem datas, não inventa", () => {
    const page = authorProfileJsonLd({ name: "Maria Souza", url: "https://bewild.com.br/conteudos/maria" }, { image: "https://x/capa.jpg" });
    expect(page).not.toHaveProperty("dateCreated");
    expect((page.mainEntity as Record<string, unknown>).image).toBe("https://x/capa.jpg");
    expect((page.mainEntity as Record<string, unknown>)["@id"]).toBe("https://bewild.com.br/conteudos/maria#person");
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
