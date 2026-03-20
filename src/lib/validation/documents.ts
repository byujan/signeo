import { z } from "zod";

export const createDocumentSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
});

export const updateDocumentSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  signing_order_enabled: z.boolean().optional(),
});
