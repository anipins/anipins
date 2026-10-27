export class RequestBodyError extends Error {
  constructor(readonly status: 400 | 413 | 415, message = "Invalid request.") {
    super(message);
    this.name = "RequestBodyError";
  }
}

export async function readBoundedText(request: Request, maxBytes: number): Promise<string> {
  const declaredLength = request.headers.get("content-length");
  if (declaredLength !== null) {
    if (!/^\d+$/.test(declaredLength)) throw new RequestBodyError(400);
    if (Number(declaredLength) > maxBytes) throw new RequestBodyError(413, "Request body is too large.");
  }

  if (!request.body) return "";
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new RequestBodyError(413, "Request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new RequestBodyError(400);
  }
}

export async function readBoundedJson(request: Request, maxBytes: number): Promise<Record<string, unknown>> {
  if (!(request.headers.get("content-type") || "").toLowerCase().startsWith("application/json")) {
    throw new RequestBodyError(415, "Send a JSON request.");
  }
  const text = await readBoundedText(request, maxBytes);
  try {
    const value: unknown = JSON.parse(text);
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("not an object");
    return value as Record<string, unknown>;
  } catch {
    throw new RequestBodyError(400);
  }
}
