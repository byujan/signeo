import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableMock } from "@/test/mocks/supabase";
import { mockRequest } from "@/test/mocks/helpers";

// ── Mocks ──────────────────────────────────────────────
vi.mock("@/lib/supabase/typed-admin", () => ({
  admin: vi.fn(),
  adminInsert: vi.fn(),
  adminSelectOne: vi.fn(),
  adminSelectMany: vi.fn(),
}));
vi.mock("./audit", () => ({ logEvent: vi.fn() }));
vi.mock("./email", () => ({
  sendSigningInvite: vi.fn(),
  sendCompletionNotice: vi.fn(),
}));
vi.mock("./storage", () => ({ getSignedUrl: vi.fn() }));
vi.mock("./pdf", () => ({ finalizePdf: vi.fn() }));
vi.mock("@/lib/utils/tokens", () => ({
  hashToken: vi.fn((raw: string) => `hashed-${raw}`),
  generateToken: vi.fn(() => ({ raw: "new-raw", hash: "new-hash" })),
}));

import {
  validateToken,
  getSigningSession,
  fillField,
  completeSigning,
} from "./signing";
import {
  admin,
  adminInsert,
  adminSelectOne,
  adminSelectMany,
} from "@/lib/supabase/typed-admin";
import { logEvent } from "./audit";
import { finalizePdf } from "./pdf";
import { sendCompletionNotice, sendSigningInvite } from "./email";
import { getSignedUrl } from "./storage";

beforeEach(() => {
  vi.resetAllMocks();
});

// ── validateToken ──────────────────────────────────────

describe("validateToken", () => {
  function setupTokenChain(data: unknown) {
    const chain = createChainableMock({ data, error: null });
    vi.mocked(admin).mockReturnValue(chain as any);
    return chain;
  }

  it("throws for unknown token", async () => {
    setupTokenChain(null);
    await expect(validateToken("doc-1", "bad-token")).rejects.toThrow(
      "Invalid signing link"
    );
  });

  it("throws for revoked token", async () => {
    setupTokenChain({
      id: "t1",
      recipient_id: "r1",
      expires_at: new Date(Date.now() + 100000).toISOString(),
      revoked: true,
    });
    await expect(validateToken("doc-1", "tok")).rejects.toThrow("revoked");
  });

  it("throws for expired token", async () => {
    setupTokenChain({
      id: "t1",
      recipient_id: "r1",
      expires_at: new Date(Date.now() - 100000).toISOString(),
      revoked: false,
    });
    await expect(validateToken("doc-1", "tok")).rejects.toThrow("expired");
  });

  it("throws if recipient doesn't belong to document", async () => {
    setupTokenChain({
      id: "t1",
      recipient_id: "r1",
      expires_at: new Date(Date.now() + 100000).toISOString(),
      revoked: false,
    });
    vi.mocked(adminSelectOne).mockResolvedValueOnce({
      id: "r1",
      document_id: "doc-OTHER",
    } as any);

    await expect(validateToken("doc-1", "tok")).rejects.toThrow(
      "Invalid signing link"
    );
  });

  it("returns recipientId and tokenId on success", async () => {
    setupTokenChain({
      id: "t1",
      recipient_id: "r1",
      expires_at: new Date(Date.now() + 100000).toISOString(),
      revoked: false,
    });
    vi.mocked(adminSelectOne).mockResolvedValueOnce({
      id: "r1",
      document_id: "doc-1",
    } as any);

    const result = await validateToken("doc-1", "tok");
    expect(result).toEqual({ recipientId: "r1", tokenId: "t1" });
  });
});

// ── getSigningSession ──────────────────────────────────

describe("getSigningSession", () => {
  it("throws if document is completed", async () => {
    vi.mocked(adminSelectOne).mockResolvedValueOnce({
      id: "d1",
      status: "completed",
      signing_order_enabled: false,
    } as any);

    await expect(
      getSigningSession("d1", "r1", mockRequest())
    ).rejects.toThrow("completed");
  });

  it("throws if document is voided", async () => {
    vi.mocked(adminSelectOne).mockResolvedValueOnce({
      id: "d1",
      status: "voided",
      signing_order_enabled: false,
    } as any);

    await expect(
      getSigningSession("d1", "r1", mockRequest())
    ).rejects.toThrow("voided");
  });

  it("throws if recipient already signed", async () => {
    vi.mocked(adminSelectOne)
      .mockResolvedValueOnce({
        id: "d1",
        status: "sent",
        signing_order_enabled: false,
        original_storage_path: "p",
      } as any)
      .mockResolvedValueOnce({
        id: "r1",
        status: "signed",
        name: "A",
        email: "a@b.c",
        signing_order: 1,
      } as any);

    await expect(
      getSigningSession("d1", "r1", mockRequest())
    ).rejects.toThrow("already signed");
  });

  it("enforces signing order", async () => {
    vi.mocked(adminSelectOne)
      .mockResolvedValueOnce({
        id: "d1",
        status: "sent",
        signing_order_enabled: true,
        original_storage_path: "p",
        title: "T",
      } as any)
      .mockResolvedValueOnce({
        id: "r2",
        status: "pending",
        name: "B",
        email: "b@c.d",
        signing_order: 2,
        role: "signer",
      } as any);
    vi.mocked(adminSelectMany).mockResolvedValueOnce([
      { id: "r1", role: "signer", signing_order: 1, status: "pending" },
    ] as any);

    await expect(
      getSigningSession("d1", "r2", mockRequest())
    ).rejects.toThrow("previous signers");
  });

  it("returns session with correct fields filtered", async () => {
    vi.mocked(adminSelectOne)
      .mockResolvedValueOnce({
        id: "d1",
        status: "sent",
        title: "Doc",
        signing_order_enabled: false,
        original_storage_path: "org/d1/original.pdf",
      } as any)
      .mockResolvedValueOnce({
        id: "r1",
        status: "notified",
        name: "Alice",
        email: "a@b.c",
        signing_order: 1,
      } as any);
    vi.mocked(adminSelectMany).mockResolvedValueOnce([
      { id: "f1", recipient_id: "r1", type: "signature" },
      { id: "f2", recipient_id: "r-other", type: "text" },
    ] as any);
    vi.mocked(getSignedUrl).mockResolvedValueOnce("https://signed-url");
    const chain = createChainableMock();
    vi.mocked(admin).mockReturnValue(chain as any);

    const session = await getSigningSession("d1", "r1", mockRequest());
    expect(session.fields).toHaveLength(1);
    expect(session.fields[0].id).toBe("f1");
    expect(session.pdfUrl).toBe("https://signed-url");
    expect(session.recipient.status).toBe("viewed");
  });
});

// ── fillField ──────────────────────────────────────────

describe("fillField", () => {
  it("throws if field not found", async () => {
    vi.mocked(adminSelectOne).mockResolvedValueOnce(null);
    await expect(
      fillField("d1", "r1", "f-nope", "val", mockRequest())
    ).rejects.toThrow("Field not found");
  });

  it("throws if field belongs to different recipient", async () => {
    vi.mocked(adminSelectOne).mockResolvedValueOnce({
      id: "f1",
      recipient_id: "r-other",
      document_id: "d1",
    } as any);
    await expect(
      fillField("d1", "r1", "f1", "val", mockRequest())
    ).rejects.toThrow("Access denied");
  });

  it("throws if recipient already signed", async () => {
    vi.mocked(adminSelectOne)
      .mockResolvedValueOnce({
        id: "f1",
        recipient_id: "r1",
        document_id: "d1",
      } as any)
      .mockResolvedValueOnce({ id: "r1", status: "signed" } as any);
    await expect(
      fillField("d1", "r1", "f1", "val", mockRequest())
    ).rejects.toThrow("fields are locked");
  });

  it("updates field value on success", async () => {
    vi.mocked(adminSelectOne)
      .mockResolvedValueOnce({
        id: "f1",
        recipient_id: "r1",
        document_id: "d1",
      } as any)
      .mockResolvedValueOnce({ id: "r1", status: "viewed" } as any);
    const chain = createChainableMock();
    vi.mocked(admin).mockReturnValue(chain as any);

    await fillField("d1", "r1", "f1", "my signature", mockRequest());

    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ value: "my signature" })
    );
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "signing.field_filled" }),
      expect.any(Request)
    );
  });
});

// ── completeSigning ────────────────────────────────────

describe("completeSigning", () => {
  it("is idempotent if already signed", async () => {
    vi.mocked(adminSelectOne).mockResolvedValueOnce({
      id: "r1",
      status: "signed",
    } as any);

    const result = await completeSigning("d1", "r1", mockRequest());
    expect(result).toEqual({ allComplete: false });
    expect(logEvent).not.toHaveBeenCalled();
  });

  it("throws if required fields are empty", async () => {
    vi.mocked(adminSelectOne).mockResolvedValueOnce({
      id: "r1",
      status: "viewed",
    } as any);
    vi.mocked(adminSelectMany).mockResolvedValueOnce([
      { id: "f1", recipient_id: "r1", required: true, value: null },
    ] as any);

    await expect(
      completeSigning("d1", "r1", mockRequest({ ip: "1.2.3.4" }))
    ).rejects.toThrow("required field(s) must be completed");
  });

  it("returns allComplete: true when last signer and calls finalizePdf", async () => {
    vi.mocked(adminSelectOne)
      .mockResolvedValueOnce({ id: "r1", status: "viewed" } as any) // recipient
      .mockResolvedValueOnce({ id: "d1", title: "T", sender_id: "s1", status: "viewed" } as any) // doc (guard check)
      .mockResolvedValueOnce({ id: "d1", title: "T", sender_id: "s1" } as any) // doc (completion email)
      .mockResolvedValueOnce({ id: "s1", email: "s@b.c", full_name: "Sender" } as any); // profile
    vi.mocked(adminSelectMany)
      .mockResolvedValueOnce([
        { id: "f1", recipient_id: "r1", required: true, value: "sig" },
      ] as any) // fields
      .mockResolvedValueOnce([
        { id: "r1", role: "signer", status: "viewed", signing_order: 1 },
      ] as any); // allRecipients
    // Chain for the atomic recipient update — must return data to indicate success
    const chain = createChainableMock({ data: { id: "r1", status: "signed" }, error: null });
    vi.mocked(admin).mockReturnValue(chain as any);
    vi.mocked(finalizePdf).mockResolvedValueOnce({ hash: "abc" });

    const result = await completeSigning(
      "d1",
      "r1",
      mockRequest({ ip: "1.2.3.4", userAgent: "Test" })
    );

    expect(result).toEqual({ allComplete: true });
    expect(finalizePdf).toHaveBeenCalledWith("d1", expect.any(Request));
    expect(sendCompletionNotice).toHaveBeenCalledWith(
      expect.objectContaining({ to: "s@b.c" })
    );
  });

  it("returns allComplete: false and updates to partially_signed when not all complete", async () => {
    vi.mocked(adminSelectOne)
      .mockResolvedValueOnce({ id: "r1", status: "viewed", signing_order: 1 } as any) // recipient
      .mockResolvedValueOnce({ id: "d1", signing_order_enabled: false } as any); // doc
    vi.mocked(adminSelectMany)
      .mockResolvedValueOnce([
        { id: "f1", recipient_id: "r1", required: true, value: "sig" },
      ] as any) // fields
      .mockResolvedValueOnce([
        { id: "r1", role: "signer", status: "viewed", signing_order: 1 },
        { id: "r2", role: "signer", status: "pending", signing_order: 2 },
      ] as any); // allRecipients
    // Chain for atomic recipient update — return data so it doesn't short-circuit
    const chain = createChainableMock({ data: { id: "r1", status: "signed" }, error: null });
    vi.mocked(admin).mockReturnValue(chain as any);

    const result = await completeSigning(
      "d1",
      "r1",
      mockRequest({ ip: "1.2.3.4" })
    );

    expect(result).toEqual({ allComplete: false });
    expect(finalizePdf).not.toHaveBeenCalled();
    // The chain.update is called first for the atomic signed update, then for partially_signed
    expect(chain.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "partially_signed" })
    );
  });

  it("notifies next signer when signing_order_enabled", async () => {
    vi.mocked(adminSelectOne)
      .mockResolvedValueOnce({ id: "r1", status: "viewed", signing_order: 1 } as any) // recipient
      .mockResolvedValueOnce({
        id: "d1",
        signing_order_enabled: true,
        expires_at: "2099-01-01T00:00:00Z",
        sender_id: "s1",
        title: "T",
      } as any); // doc (for next signer notification)
    vi.mocked(adminSelectMany)
      .mockResolvedValueOnce([
        { id: "f1", recipient_id: "r1", required: true, value: "sig" },
      ] as any) // fields
      .mockResolvedValueOnce([
        { id: "r1", role: "signer", status: "viewed", signing_order: 1 },
        { id: "r2", role: "signer", status: "pending", signing_order: 2, email: "next@b.c", name: "Next" },
      ] as any); // allRecipients
    // Chain for atomic recipient update — return data so it doesn't short-circuit
    const chain = createChainableMock({ data: { id: "r1", status: "signed" }, error: null });
    vi.mocked(admin).mockReturnValue(chain as any);
    vi.mocked(adminInsert).mockResolvedValueOnce({} as any);
    vi.mocked(adminSelectOne)
      .mockResolvedValueOnce({ id: "s1", email: "s@b.c", full_name: "Sender" } as any); // profile

    await completeSigning(
      "d1",
      "r1",
      mockRequest({ ip: "1.2.3.4" })
    );

    expect(sendSigningInvite).toHaveBeenCalledWith(
      expect.objectContaining({ to: "next@b.c" })
    );
  });
});
