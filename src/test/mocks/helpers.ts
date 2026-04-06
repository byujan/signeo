/** Build a minimal Request object with optional headers. */
export function mockRequest(
  options: { ip?: string; userAgent?: string } = {}
): Request {
  const headers = new Headers();
  if (options.ip) headers.set("x-forwarded-for", options.ip);
  if (options.userAgent) headers.set("user-agent", options.userAgent);
  return new Request("http://localhost/test", { headers });
}
