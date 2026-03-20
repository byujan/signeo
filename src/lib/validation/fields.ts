import { z } from "zod";

export const fieldSchema = z.object({
  id: z.string().uuid().optional(),
  recipient_id: z.string().uuid(),
  type: z.enum([
    "signature",
    "initials",
    "date",
    "full_name",
    "text",
    "checkbox",
  ]),
  page: z.number().int().min(1),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  width: z.number().min(1).max(100),
  height: z.number().min(1).max(100),
  required: z.boolean().default(true),
  label: z.string().max(100).nullish(),
});

export const batchFieldsSchema = z.object({
  fields: z.array(fieldSchema).min(1).max(200),
});

export const fillFieldSchema = z.object({
  field_id: z.string().uuid(),
  value: z.string().max(5000),
});

export const completeSigningSchema = z.object({
  consent: z.literal(true, {
    error: "You must consent to electronic signing",
  }),
});
