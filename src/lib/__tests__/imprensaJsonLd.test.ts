import { describe, expect, it } from "vitest";
import { imprensaVideoJsonLd } from "@/lib/imprensaJsonLd";

describe("VideoObject da imprensa", () => {
  const v = imprensaVideoJsonLd() as Record<string, string>;
  it("uploadDate é ISO 8601 com fuso horário", () => {
    expect(v.uploadDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(Z|[+-]\d{2}:\d{2})$/);
  });
  it("traz contentUrl absoluta (o R7 não publica embedUrl, então ele não é inventado)", () => {
    expect(v.contentUrl).toMatch(/^https:\/\/.+\.mp4$/);
    expect(v.embedUrl).toBeUndefined();
  });
});
