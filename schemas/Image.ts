import { SUPPORTED_OUTPUT_FORMATS } from "@/types/ImageTypes";
import { z } from "zod";

export const ImageSchema = z.object({
  image: z.instanceof(File).refine((file) => file.size <= 5000000, {
    message: "Image must be less than 5MB",
  }),
  outputFormat: z.enum(SUPPORTED_OUTPUT_FORMATS),
  quality: z.number().min(1).max(100).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).optional(),
});


export const CompactedSchema = z.object({
  compacted: z.instanceof(File).refine((file) => file.size <= 500000000, {
    message: "Image must be less than 50MB",
  }),
  outputFormat: z.enum(SUPPORTED_OUTPUT_FORMATS),
  quality: z.number().min(1).max(100).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).optional(),
});
