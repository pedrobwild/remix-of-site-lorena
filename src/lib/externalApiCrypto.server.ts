const encoder = new TextEncoder();

async function encryptionKey(secret: string) {
  if (!secret) throw new Error("Proteção das chaves indisponível.");
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(secret));
  return crypto.subtle.importKey("raw", digest, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptApiKey(value: string, secret: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await encryptionKey(secret), encoder.encode(value));
  return `${btoa(String.fromCharCode(...iv))}.${btoa(String.fromCharCode(...new Uint8Array(encrypted)))}`;
}

export async function decryptApiKey(value: string, secret: string): Promise<string> {
  const [ivPart, dataPart] = value.split(".");
  if (!ivPart || !dataPart) throw new Error("Chave protegida inválida.");
  const decode = (part: string) => Uint8Array.from(atob(part), character => character.charCodeAt(0));
  const decrypted = await crypto.subtle.decrypt({ name: "AES-GCM", iv: decode(ivPart) }, await encryptionKey(secret), decode(dataPart));
  return new TextDecoder().decode(decrypted);
}