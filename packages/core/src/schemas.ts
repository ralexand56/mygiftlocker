import { z } from "zod";

/** Runtime validation shared by web forms, mobile forms and Amplify functions. */

export const partialDateSchema = z
  .object({
    month: z.number().int().min(1).max(12),
    day: z.number().int().min(1).max(31),
    year: z.number().int().min(1900).max(2100).optional(),
  })
  .refine((d) => d.day <= new Date(d.year ?? 2024, d.month, 0).getDate(), { message: "That day doesn't exist in that month" });

export const addressSchema = z.object({
  name: z.string().max(120).optional(),
  line1: z.string().min(1, "Street address is required").max(200),
  line2: z.string().max(200).optional(),
  city: z.string().min(1, "City is required").max(120),
  region: z.string().min(1, "State is required").max(120),
  postalCode: z.string().min(3, "ZIP / postal code is required").max(20),
  country: z.string().length(2),
});

export const usZipSchema = z.string().regex(/^\d{5}(-\d{4})?$/, "Use a 5-digit ZIP");

export const wishSchema = z.object({
  title: z.string().min(1).max(200),
  url: z.string().url().optional().or(z.literal("")),
  note: z.string().max(500).optional(),
});

export const exchangeSchema = z.object({
  name: z.string().min(2, "Give your exchange a name").max(80),
  date: z.string().optional(),
  budget: z.number().nonnegative().max(100_000).optional(),
  message: z.string().max(1000).optional(),
  wishCount: z.number().int().min(1).max(10),
});
