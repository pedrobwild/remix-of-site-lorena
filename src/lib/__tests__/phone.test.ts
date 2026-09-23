import { describe, it, expect } from "vitest";
import { formatBrPhone, isValidBrPhone, normalizeBrPhoneDigits } from "../phone";

describe("normalizeBrPhoneDigits", () => {
  it("remove o DDI 55 do autofill em vez de cortar o fim do número", () => {
    expect(normalizeBrPhoneDigits("+55 11 91234-5678")).toBe("11912345678");
    expect(normalizeBrPhoneDigits("5511912345678")).toBe("11912345678");
  });

  it("remove o prefixo de tronco 0", () => {
    expect(normalizeBrPhoneDigits("011 91234-5678")).toBe("11912345678");
  });

  it("não confunde o DDD 55 (RS) com o DDI", () => {
    expect(normalizeBrPhoneDigits("(55) 99123-4567")).toBe("55991234567");
    expect(normalizeBrPhoneDigits("+55 55 99123-4567")).toBe("55991234567");
  });
});

describe("formatBrPhone", () => {
  it("formata progressivamente", () => {
    expect(formatBrPhone("")).toBe("");
    expect(formatBrPhone("1")).toBe("(1");
    expect(formatBrPhone("1191")).toBe("(11) 91");
    expect(formatBrPhone("1191234567")).toBe("(11) 9123-4567");
    expect(formatBrPhone("11912345678")).toBe("(11) 91234-5678");
  });

  it("reformatar um valor já formatado é idempotente", () => {
    expect(formatBrPhone(formatBrPhone("+55 11 91234-5678"))).toBe("(11) 91234-5678");
  });
});

describe("isValidBrPhone", () => {
  it("aceita celular (11 dígitos com 9) e fixo (10 dígitos)", () => {
    expect(isValidBrPhone("(11) 91234-5678")).toBe(true);
    expect(isValidBrPhone("(11) 3456-7890")).toBe(true);
  });

  it("recusa DDD com zero, celular sem 9 e comprimentos errados", () => {
    expect(isValidBrPhone("(10) 91234-5678")).toBe(false);
    expect(isValidBrPhone("(11) 81234-5678")).toBe(false);
    expect(isValidBrPhone("(11) 9123-456")).toBe(false);
  });
});
