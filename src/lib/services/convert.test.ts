import { describe, it, expect } from "vitest";
import { isPdfFile, isWordFile } from "./convert";

describe("isPdfFile", () => {
  it("returns true for application/pdf", () => {
    expect(isPdfFile("application/pdf")).toBe(true);
  });

  it("returns false for other mime types", () => {
    expect(isPdfFile("application/json")).toBe(false);
    expect(isPdfFile("text/plain")).toBe(false);
    expect(isPdfFile("image/png")).toBe(false);
  });
});

describe("isWordFile", () => {
  it("returns true for .docx mime type", () => {
    expect(
      isWordFile(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      )
    ).toBe(true);
  });

  it("returns true for .doc mime type", () => {
    expect(isWordFile("application/msword")).toBe(true);
  });

  it("returns false for non-word mime types", () => {
    expect(isWordFile("application/pdf")).toBe(false);
    expect(isWordFile("text/plain")).toBe(false);
  });
});
