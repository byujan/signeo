import { describe, it, expect, vi, beforeEach } from "vitest";

// Single top-level mock — the failing send is configured here
vi.mock("resend", () => ({
  Resend: vi.fn().mockImplementation(() => ({
    emails: {
      send: vi.fn().mockRejectedValue(new Error("API down")),
    },
  })),
}));

describe("email service error swallowing", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("sendSigningInvite throws when Resend fails", async () => {
    const { sendSigningInvite } = await import("./email");

    await expect(
      sendSigningInvite({
        to: "a@b.c",
        recipientName: "Alice",
        documentTitle: "Doc",
        signingUrl: "https://example.com/sign",
        senderName: "Bob",
      })
    ).rejects.toThrow();
  });

  it("sendCompletionNotice does not throw when Resend fails", async () => {
    const { sendCompletionNotice } = await import("./email");

    await expect(
      sendCompletionNotice({
        to: "a@b.c",
        senderName: "Alice",
        documentTitle: "Doc",
        dashboardUrl: "https://example.com/docs/1",
      })
    ).resolves.toBeUndefined();
  });
});
