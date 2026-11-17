export class HttpError extends Error {
  constructor(public code: number, message: string) { super(message); }
}
export async function limitedBody(req: Request, maxBytes = 16384) {
  if (!req.body) throw new HttpError(400, "Request body required");
  const reader = req.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    length += value.byteLength;
    if (length > maxBytes) { await reader.cancel(); throw new HttpError(413, "Request body too large"); }
    chunks.push(value);
  }
  return Buffer.concat(chunks);
}
export async function jsonBody(req: Request, maxBytes = 16384) {
  try { return JSON.parse((await limitedBody(req,maxBytes)).toString("utf8")) as unknown; }
  catch (error) { if (error instanceof HttpError) throw error; throw new HttpError(400, "Invalid JSON body"); }
}
