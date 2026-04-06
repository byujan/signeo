import { describe, it, expect, vi, beforeEach } from "vitest";
import { createChainableMock } from "@/test/mocks/supabase";
import { mockRequest } from "@/test/mocks/helpers";
import type { Recipient } from "@/types";

// ── Mocks ──────────────────────────────────────────────
vi.mock("@/lib/supabase/typed-admin", () => ({
  admin: vi.fn(),
  adminInsert: vi.fn(),
  adminSelectOne: vi.fn(),
  adminSelectMany: vi.fn(),
}));
vi.mock("./audit", () => ({ logEvent: vi.fn() }));
vi.mock("./email", () => ({ sendSigningInvite: vi.fn() }));
vi.mock("./storage", () => ({ uploadFile: vi.fn() }));
vi.mock("./pdf", () => ({ getPageCount: vi.fn() }));

import {
  canTransition,
  computeDocumentStatus,
  createDocument,
  sendDocument,
  voidDocument,
} from "./documents";
import {
  admin,
  adminInsert,
  adminSelectMany,
} from "@/lib/supabase/typed-admin";
import { logEvent } from "./audit";
import { sendSigningInvite } from "./email";
import { uploadFile } from "./storage";
import { getPageCount } from "./pdf";

// ── Pure functions ─────────────────────────────────────

describe("canTransition", () => {
  it("allows draft → sent", () => {
    expect(canTransition("draft", "sent")).toBe(true);
  });

  it("allows draft → voided", () => {
    expect(canTransition("draft", "voided")).toBe(true);
  });

  it("rejects draft → completed", () => {
    expect(canTransition("draft", "completed")).toBe(false);
  });

  it("allows sent → viewed", () => {
    expect(canTransition("sent", "viewed")).toBe(true);
  });

  it("allows viewed → completed", () => {
    expect(canTransition("viewed", "completed")).toBe(true);
  });

  it("allows partially_signed → completed", () => {
    expect(canTransition("partially_signed", "completed")).toBe(true);
  });

  it("rejects completed → anything", () => {
    expect(canTransition("completed", "draft")).toBe(false);
    expect(canTransition("completed", "voided")).toBe(false);
    expect(canTransition("completed", "sent")).toBe(false);
  });

  it("rejects voided → anything", () => {
    expect(canTransition("voided", "draft")).toBe(false);
    expect(canTransition("voided", "sent")).toBe(false);
  });

  it("rejects expired → anything", () => {
    expect(canTransition("expired", "sent")).toBe(false);
  });
});

describe("computeDocumentStatus", () => {
  const signer = (status: Recipient["status"]): Pick<Recipient, "status" | "role"> => ({
    role: "signer",
    status,
  });
  const viewer = (status: Recipient["status"]): Pick<Recipient, "status" | "role"> => ({
    role: "viewer",
    status,
  });

  it('returns "completed" when all signers signed', () => {
    expect(
      computeDocumentStatus([signer("signed"), signer("signed")])
    ).toBe("completed");
  });

  it('returns "partially_signed" when some signed', () => {
    expect(
      computeDocumentStatus([signer("signed"), signer("pending")])
    ).toBe("partially_signed");
  });

  it('returns "viewed" when one viewed, none signed', () => {
    expect(
      computeDocumentStatus([signer("viewed"), signer("pending")])
    ).toBe("viewed");
  });

  it('returns "sent" when none signed or viewed', () => {
    expect(
      computeDocumentStatus([signer("pending"), signer("notified")])
    ).toBe("sent");
  });

  it("ignores viewers when computing status", () => {
    expect(
      computeDocumentStatus([signer("signed"), viewer("pending")])
    ).toBe("completed");
  });
});

// ── Service functions (mocked Supabase) ────────────────

describe("createDocument", () => {
  beforeEach(() => vi.clearAllMocks());

  it("calls getPageCount, adminInsert, uploadFile, logEvent and returns doc", async () => {
    const fakeDoc = { id: "doc-1", title: "Test" };
    const chain = createChainableMock();
    vi.mocked(admin).mockReturnValue(chain as any);
    vi.mocked(getPageCount).mockResolvedValue(3);
    vi.mocked(adminInsert).mockResolvedValue(fakeDoc as any);

    const result = await createDocument(
      "sender-1",
      "org-1",
      "Test",
      new ArrayBuffer(8),
      mockRequest()
    );

    expect(getPageCount).toHaveBeenCalledOnce();
    expect(adminInsert).toHaveBeenCalledWith("documents", expect.objectContaining({
      sender_id: "sender-1",
      org_id: "org-1",
      title: "Test",
      page_count: 3,
    }));
    expect(uploadFile).toHaveBeenCalledWith(
      "documents",
      "org-1/doc-1/original.pdf",
      expect.any(ArrayBuffer),
      "application/pdf"
    );
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "document.created" }),
      expect.any(Request)
    );
    expect(result.original_storage_path).toBe("org-1/doc-1/original.pdf");
  });
});

describe("sendDocument", () => {
  beforeEach(() => vi.clearAllMocks());

  function setupChain(data: unknown) {
    const chain = createChainableMock({ data, error: null });
    vi.mocked(admin).mockReturnValue(chain as any);
    return chain;
  }

  it("throws if document not found or not draft", async () => {
    setupChain(null);
    await expect(
      sendDocument("doc-1", "sender-1", "Alice", mockRequest())
    ).rejects.toThrow("Document not found or not in draft status");
  });

  it("throws if no recipients", async () => {
    setupChain({ id: "doc-1", title: "T", signing_order_enabled: false });
    vi.mocked(adminSelectMany)
      .mockResolvedValueOnce([]) // recipients
      ;

    await expect(
      sendDocument("doc-1", "sender-1", "Alice", mockRequest())
    ).rejects.toThrow("Add at least one recipient first");
  });

  it("throws if no fields", async () => {
    setupChain({ id: "doc-1", title: "T", signing_order_enabled: false });
    vi.mocked(adminSelectMany)
      .mockResolvedValueOnce([{ id: "r1", signing_order: 1, email: "a@b.c", name: "A" }] as any) // recipients
      .mockResolvedValueOnce([]); // fields

    await expect(
      sendDocument("doc-1", "sender-1", "Alice", mockRequest())
    ).rejects.toThrow("Place at least one field first");
  });

  it("generates tokens and sends emails for each recipient", async () => {
    setupChain({ id: "doc-1", title: "T", signing_order_enabled: false });
    vi.mocked(adminSelectMany)
      .mockResolvedValueOnce([
        { id: "r1", signing_order: 1, email: "a@b.c", name: "A" },
        { id: "r2", signing_order: 2, email: "x@y.z", name: "B" },
      ] as any)
      .mockResolvedValueOnce([{ id: "f1" }] as any); // fields
    vi.mocked(adminInsert).mockResolvedValue({} as any);

    await sendDocument("doc-1", "sender-1", "Alice", mockRequest());

    // Both recipients get tokens
    expect(adminInsert).toHaveBeenCalledTimes(2);
    // Both get emails (signing_order_enabled = false)
    expect(sendSigningInvite).toHaveBeenCalledTimes(2);
  });

  it("only notifies first recipient when signing_order_enabled", async () => {
    setupChain({ id: "doc-1", title: "T", signing_order_enabled: true });
    vi.mocked(adminSelectMany)
      .mockResolvedValueOnce([
        { id: "r1", signing_order: 1, email: "a@b.c", name: "A" },
        { id: "r2", signing_order: 2, email: "x@y.z", name: "B" },
      ] as any)
      .mockResolvedValueOnce([{ id: "f1" }] as any);
    vi.mocked(adminInsert).mockResolvedValue({} as any);

    await sendDocument("doc-1", "sender-1", "Alice", mockRequest());

    // Both get tokens
    expect(adminInsert).toHaveBeenCalledTimes(2);
    // Only first gets email
    expect(sendSigningInvite).toHaveBeenCalledTimes(1);
    expect(vi.mocked(sendSigningInvite).mock.calls[0][0]).toMatchObject({
      to: "a@b.c",
    });
  });
});

describe("voidDocument", () => {
  beforeEach(() => vi.clearAllMocks());

  function setupChain(data: unknown) {
    const chain = createChainableMock({ data, error: null });
    vi.mocked(admin).mockReturnValue(chain as any);
    return chain;
  }

  it("throws if document not found", async () => {
    setupChain(null);
    await expect(
      voidDocument("doc-1", "sender-1", mockRequest())
    ).rejects.toThrow("Document not found");
  });

  it("throws if transition invalid (e.g. from completed)", async () => {
    setupChain({ status: "completed" });
    await expect(
      voidDocument("doc-1", "sender-1", mockRequest())
    ).rejects.toThrow("Cannot void this document");
  });

  it("revokes tokens and updates status", async () => {
    const chain = createChainableMock({ data: { status: "sent" }, error: null });
    vi.mocked(admin).mockReturnValue(chain as any);
    vi.mocked(adminSelectMany).mockResolvedValue([
      { id: "r1" },
      { id: "r2" },
    ] as any);

    await voidDocument("doc-1", "sender-1", mockRequest());

    // Revokes tokens via .in()
    expect(chain.in).toHaveBeenCalledWith("recipient_id", ["r1", "r2"]);
    expect(logEvent).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: "document.voided" }),
      expect.any(Request)
    );
  });
});
