import { describe, it, expect } from "vitest";
import { getClientInfo } from "./request";

function req(headers: Record<string, string> = {}): Request {
  const h = new Headers();
  for (const [k, v] of Object.entries(headers)) h.set(k, v);
  return new Request("http://localhost", { headers: h });
}

describe("getClientInfo", () => {
  it("extracts IP from x-forwarded-for", () => {
    const { ip } = getClientInfo(req({ "x-forwarded-for": "1.2.3.4" }));
    expect(ip).toBe("1.2.3.4");
  });

  it("takes the first IP from a comma-separated list", () => {
    const { ip } = getClientInfo(
      req({ "x-forwarded-for": "10.0.0.1, 10.0.0.2, 10.0.0.3" })
    );
    expect(ip).toBe("10.0.0.1");
  });

  it("extracts user-agent header", () => {
    const { userAgent } = getClientInfo(
      req({ "user-agent": "Mozilla/5.0" })
    );
    expect(userAgent).toBe("Mozilla/5.0");
  });

  it("returns null for missing headers", () => {
    const { ip, userAgent } = getClientInfo(req());
    expect(ip).toBeNull();
    expect(userAgent).toBeNull();
  });
});
