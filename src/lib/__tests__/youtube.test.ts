import { describe, it, expect } from "vitest";
import { sanitizeBlogHtml, sanitizeBlogHtmlServer } from "../sanitizeHtml";
import { extractYouTubeEmbeds, parseYouTubeEmbedSrc, parseYouTubeId } from "../youtube";

const ID = "dQw4w9WgXcQ";

describe("parseYouTubeId", () => {
  it.each([
    [`https://www.youtube.com/watch?v=${ID}&t=10s`, ID],
    [`https://youtu.be/${ID}?si=abc`, ID],
    [`https://www.youtube.com/shorts/${ID}`, ID],
    [`https://m.youtube.com/watch?v=${ID}`, ID],
    [`https://www.youtube.com/embed/${ID}`, ID],
    [`youtube.com/watch?v=${ID}`, ID],
    [ID, ID],
  ])("%s", (input, expected) => expect(parseYouTubeId(input)).toBe(expected));

  it.each(["", "https://evil.example/watch?v=" + ID, "javascript:alert(1)", "https://youtube.com/watch?v=curto", "https://youtube.com/"])(
    "recusa %s",
    (input) => expect(parseYouTubeId(input)).toBeNull(),
  );
});

describe("parseYouTubeEmbedSrc", () => {
  it("aceita só embed do YouTube", () => {
    expect(parseYouTubeEmbedSrc(`https://www.youtube.com/embed/${ID}?rel=0`)).toBe(ID);
    expect(parseYouTubeEmbedSrc(`https://www.youtube-nocookie.com/embed/${ID}`)).toBe(ID);
    expect(parseYouTubeEmbedSrc(`http://www.youtube.com/embed/${ID}`)).toBeNull();
    expect(parseYouTubeEmbedSrc(`https://youtube.com.evil.example/embed/${ID}`)).toBeNull();
    expect(parseYouTubeEmbedSrc(`https://evil.example/embed/${ID}`)).toBeNull();
  });
});

const good = `<p>a</p><iframe src="https://www.youtube.com/embed/${ID}?autoplay=1" title="Tour pelo studio" width="999" onload="alert(1)" style="x:y"></iframe><p>b</p>`;

describe.each([
  ["cliente", sanitizeBlogHtml],
  ["servidor", sanitizeBlogHtmlServer],
])("iframe do YouTube — %s", (_n, fn) => {
  it("reescreve para youtube-nocookie com atributos fixos", () => {
    const out = fn(good);
    expect(out).toContain(`<iframe src="https://www.youtube-nocookie.com/embed/${ID}"`);
    expect(out).toContain('title="Tour pelo studio"');
    expect(out).toContain('loading="lazy"');
    expect(out).toContain("allowfullscreen");
    expect(out).not.toMatch(/onload|style=|autoplay|width=/i);
    expect(out.match(/<iframe/g)).toHaveLength(1);
    expect(out.match(/<\/iframe>/g)).toHaveLength(1);
    expect(out).toContain("<p>a</p>");
    expect(out).toContain("<p>b</p>");
  });

  it("remove iframes de outros domínios e esquemas", () => {
    for (const src of ["https://evil.example/embed/" + ID, "javascript:alert(1)", "https://youtube.com.evil.example/embed/" + ID]) {
      const out = fn(`<p>x</p><iframe src="${src}">dentro</iframe><p>y</p>`);
      expect(out).not.toMatch(/iframe/i);
      expect(out).toContain("<p>y</p>");
    }
  });

  it("iframe inválido depois de um válido não escapa", () => {
    const out = fn(`${good}<iframe src="https://evil.example/"></iframe>`);
    expect(out.match(/<iframe/g)).toHaveLength(1);
    expect(out).not.toContain("evil.example");
  });
});

describe("cliente e servidor geram o mesmo HTML", () => {
  it("player válido", () => {
    expect(sanitizeBlogHtmlServer(good)).toBe(sanitizeBlogHtml(good));
  });
});

describe("extractYouTubeEmbeds", () => {
  it("lista ID e título sem repetir", () => {
    const html = sanitizeBlogHtmlServer(good + good);
    expect(extractYouTubeEmbeds(html)).toEqual([{ id: ID, title: "Tour pelo studio", start: null, end: null }]);
    expect(extractYouTubeEmbeds(undefined)).toEqual([]);
  });
});

import { isoDurationSeconds, parseYouTubeEnd, parseYouTubeStart as _start, youtubeEmbedUrl as _embed } from "@/lib/youtube";
import { sanitizeBlogHtmlServer as _srv } from "@/lib/sanitizeHtml";
describe("início do vídeo (t=)", () => {
  it("lê t= em segundos e em h/m/s", () => {
    expect(_start("https://www.youtube.com/watch?v=pQjZeD8nYEE&t=467s")).toBe(467);
    expect(_start("https://youtu.be/pQjZeD8nYEE?t=7m47s")).toBe(467);
    expect(_start("https://www.youtube.com/embed/pQjZeD8nYEE?start=467")).toBe(467);
    expect(_start("https://www.youtube.com/watch?v=pQjZeD8nYEE")).toBeNull();
  });
  it("lê end= e duração ISO", () => {
    expect(parseYouTubeEnd("https://www.youtube-nocookie.com/embed/pQjZeD8nYEE?start=467&end=520")).toBe(520);
    expect(parseYouTubeEnd("https://www.youtube-nocookie.com/embed/pQjZeD8nYEE?start=467")).toBeNull();
    expect(isoDurationSeconds("PT9M49S")).toBe(589);
    expect(isoDurationSeconds("PT1H2M3S")).toBe(3723);
    expect(isoDurationSeconds("PT")).toBeNull();
    expect(isoDurationSeconds(undefined)).toBeNull();
  });
  it("gera e preserva start no player", () => {
    expect(_embed("pQjZeD8nYEE", 467)).toBe("https://www.youtube-nocookie.com/embed/pQjZeD8nYEE?start=467");
    const out = _srv('<iframe src="https://www.youtube-nocookie.com/embed/pQjZeD8nYEE?start=467"></iframe>');
    expect(out).toContain("embed/pQjZeD8nYEE?start=467");
  });
});
