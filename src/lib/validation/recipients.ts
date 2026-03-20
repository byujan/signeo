import { z } from "zod";

export const addRecipientSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  email: z.string().email("Invalid email"),
  role: z.enum(["signer", "viewer"]).default("signer"),
  signing_order: z.number().int().min(1).default(1),
});
