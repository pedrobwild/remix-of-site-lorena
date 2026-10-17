/** Encaminha somente leitura autenticada pela própria chave de exportação. */
export async function proxyExport(request: Request, backendUrl: string, fetchImpl: typeof fetch = fetch) {
  const incoming = new URL(request.url);
  const target = new URL(`${backendUrl.replace(/\/+$/, "")}/functions/v1/data-export`);
  const allowed = ["dataset", "format", "sep", "dec", "days", "from", "to", "key"];
  for (const name of allowed) {
    const value = incoming.searchParams.get(name);
    if (value !== null) target.searchParams.set(name, value);
  }
  const headers = new Headers();
  for (const name of ["authorization", "x-export-key"]) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const response = await fetchImpl(target, { method: "GET", headers, redirect: "error" });
  const output = new Headers({ "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" });
  for (const name of ["content-type", "content-disposition", "retry-after"]) {
    const value = response.headers.get(name);
    if (value) output.set(name, value);
  }
  return new Response(response.body, { status: response.status, headers: output });
}