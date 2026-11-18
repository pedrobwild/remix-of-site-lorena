import { describe, expect, it } from "vitest";
import { addHeadingIds } from "../articleHeadingIds";

const ids = (html: string) => Array.from(addHeadingIds(html).matchAll(/ id="([^"]*)"/g), (match) => match[1]);

describe("addHeadingIds", () => {
  it("gera a âncora exata do modelo de contratação", () => {
    expect(ids("<h2>Turnkey, empreiteiro, arquiteto e obra ou administração: qual modelo contratar?</h2>")).toEqual([
      "turnkey-empreiteiro-arquiteto-e-obra-ou-administracao-qual-modelo-contratar",
    ]);
  });
  it("remove acentos e normaliza pontuação e maiúsculas", () => {
    expect(ids("<h3> São PAULO: administração — execução! </h3>")).toEqual(["sao-paulo-administracao-execucao"]);
  });
  it("decodifica as entidades básicas depois de remover tags", () => {
    expect(ids("<h2>A&amp;B &quot;C&quot; &#39;D&#39; &lt;E&gt;</h2>")).toEqual(["a-b-c-d-e"]);
  });
  it("numera duplicados entre h2 e h3", () => {
    expect(ids("<h2>Obra</h2><h3>Obra</h3><h2>Obra</h2>")).toEqual(["obra", "obra-2", "obra-3"]);
  });
  it("preserva h2 com id existente e reserva seus ids, mesmo posteriores", () => {
    const existing = '<h2 id="obra">Título original</h2>';
    expect(addHeadingIds(existing)).toBe(existing);
    expect(ids(`<h3>Obra</h3>${existing}`)).toEqual(["obra-2", "obra"]);
  });
  it("não adiciona id em h4", () => {
    expect(addHeadingIds("<h4>Obra</h4>")).toBe("<h4>Obra</h4>");
  });
  it("usa texto de link e strong, preservando a marcação", () => {
    expect(addHeadingIds('<h2>Como <a href="/orcamento">contratar</a> <strong>reforma</strong>?</h2>'))
      .toBe('<h2 id="como-contratar-reforma">Como <a href="/orcamento">contratar</a> <strong>reforma</strong>?</h2>');
  });
  it("devolve HTML sem h2/h3 idêntico", () => {
    const html = '<p title="Exemplo">Texto &amp; texto</p>\n<h4>Outro</h4>';
    expect(addHeadingIds(html)).toBe(html);
    expect(addHeadingIds("")).toBe("");
  });
  it("deixa slug vazio sem id", () => {
    expect(addHeadingIds("<h2>!!!</h2><h3></h3>")).toBe("<h2>!!!</h2><h3></h3>");
  });
  it("limita a base a 80 caracteres e remove hífen final", () => {
    expect(ids(`<h2>${"a".repeat(79)} palavra</h2>`)).toEqual(["a".repeat(79)]);
    expect(ids(`<h3>${"a".repeat(100)}</h3>`)).toEqual(["a".repeat(80)]);
  });
  it("preserva atributos e é idempotente", () => {
    const html = '<H2 title="a > b">Obra</H2><h3 id=fixo>Fixo</h3>';
    const result = addHeadingIds(html);
    expect(result).toBe('<H2 title="a > b" id="obra">Obra</H2><h3 id=fixo>Fixo</h3>');
    expect(addHeadingIds(result)).toBe(result);
  });
});