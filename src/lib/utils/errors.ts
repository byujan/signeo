import { ZodError } from "zod";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = "AppError";
  }
}

export function errorResponse(err: unknown) {
  if (err instanceof AppError) {
    return Response.json({ error: err.message }, { status: err.statusCode });
  }
  if (err instanceof ZodError) {
    return Response.json({ error: err.issues[0].message }, { status: 400 });
  }
  console.error("Unexpected error:", err);
  return Response.json({ error: "Internal server error" }, { status: 500 });
}
