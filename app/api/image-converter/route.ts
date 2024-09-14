import { NextRequest, NextResponse } from "next/server";
import ImageConvertr, { SupportedInputFormats, SUPPORTED_INPUT_FORMATS, SUPPORTED_OUTPUT_FORMATS } from "@/services/imageConverter";
import { z } from "zod";
import { fileTypeFromBuffer } from 'file-type';
import { formDataToObject } from "@/utils/formDataToObject";

const imageConversionSchema = z.object({
  outputFormat: z.enum(SUPPORTED_OUTPUT_FORMATS),
  quality: z.number().min(1).max(100).optional(),
  width: z.number().positive().optional(),
  height: z.number().positive().optional(),
  fit: z.enum(["cover", "contain", "fill", "inside", "outside"]).optional(),
  image: z.instanceof(Blob),
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const formObject = formDataToObject(formData);

    const validatedData = imageConversionSchema.parse({
      outputFormat: formObject.outputFormat,
      quality: formObject.quality ? Number(formObject.quality) : undefined,
      width: formObject.width ? Number(formObject.width) : undefined,
      height: formObject.height ? Number(formObject.height) : undefined,
      fit: formObject.fit,
      image: formObject.image,
    });

    const { outputFormat, quality, width, height, fit, image } = validatedData;

    const inputBuffer = Buffer.from(await image.arrayBuffer());
    
    const fileType = await fileTypeFromBuffer(inputBuffer);
    if (!fileType || !SUPPORTED_INPUT_FORMATS.includes(fileType.ext as SupportedInputFormats)) {
      throw new Error("Unsupported or undetectable input format");
    }

    const inputFormat = fileType.ext as SupportedInputFormats;

    const outputBuffer = await ImageConvertr(
      inputBuffer,
      inputFormat,
      outputFormat,
      { quality, width, height, fit }
    );

    return new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        'Content-Type': `image/${outputFormat}`,
        'Content-Disposition': `attachment; filename="converted_image.${outputFormat}"`,
      },
    });

  } catch (error) {
    console.error("Error in image conversion API route:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Invalid input data", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: error instanceof Error ? error.message : "Internal Server Error" }, { status: 500 });
  }
}