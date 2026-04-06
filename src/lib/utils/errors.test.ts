import { describe, it, expect } from "vitest";
import { AppError, errorResponse } from "./errors";
import * as z from "zod";

describe("AppError", () => {
  it("sets message and default statusCode", () => {
    const err = new AppError("bad request");
    expect(err.message).toBe("bad request");
    expect(err.statusCode).toBe(400);
    expect(err.name).toBe("AppError");
  });

  it("accepts a custom statusCode", () => {
    const err = new AppError("not found", 404);
    expect(err.statusCode).toBe(404);
  });

  it("is an instance of Error", () => {
    expect(new AppError("x")).toBeInstanceOf(Error);
  });
});

describe("errorResponse", () => {
  it("handles AppError", async () => {
    const res = errorResponse(new AppError("nope", 422));
    expect(res.status).toBe(422);
    const body = await res.json();
    expect(body.error).toBe("nope");
  });

  it("handles ZodError", async () => {
    const schema = z.object({ name: z.string() });
    let zodErr: z.ZodError | undefined;
    try {
      schema.parse({ name: 123 });
    } catch (e) {
      zodErr = e as z.ZodError;
    }
    const res = errorResponse(zodErr);
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBeTruthy();
  });

  it("handles unknown errors as 500", async () => {
    const res = errorResponse(new Error("boom"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toBe("Internal server error");
  });
});
