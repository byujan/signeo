import { describe, it, expect } from "vitest";
import { generateToken, hashToken } from "./tokens";

describe("generateToken", () => {
  it("returns an object with raw and hash strings", () => {
    const { raw, hash } = generateToken();
    expect(typeof raw).toBe("string");
    expect(typeof hash).toBe("string");
    expect(raw.length).toBeGreaterThan(0);
    expect(hash.length).toBe(64); // sha256 hex
  });

  it("produces unique tokens each call", () => {
    const a = generateToken();
    const b = generateToken();
    expect(a.raw).not.toBe(b.raw);
    expect(a.hash).not.toBe(b.hash);
  });
});

describe("hashToken", () => {
  it("is deterministic", () => {
    const raw = "test-token-abc123";
    expect(hashToken(raw)).toBe(hashToken(raw));
  });

  it("hash of raw from generateToken matches the returned hash", () => {
    const { raw, hash } = generateToken();
    expect(hashToken(raw)).toBe(hash);
  });

  it("returns a 64-char hex string", () => {
    expect(hashToken("anything")).toMatch(/^[a-f0-9]{64}$/);
  });
});
