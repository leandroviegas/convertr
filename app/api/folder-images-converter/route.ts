import path from "path";
import AdmZip from "adm-zip";
import ImageConvertr from "@/services/imageConverter";
import {
  SupportedInputFormats,
  SUPPORTED_INPUT_FORMATS
} from "@/types/ImageTypes";
import { formDataToObject } from "@/utils/formDataToObject";
import { NextRequest, NextResponse } from "next/server";
import { CompactedSchema } from "@/schemas/Image";

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const formObject = formDataToObject(formData);

  const validatedData = CompactedSchema.parse({
    outputFormat: formObject.outputFormat,
    quality: formObject.quality ? Number(formObject.quality) : undefined,
    width: formObject.width ? Number(formObject.width) : undefined,
    height: formObject.height ? Number(formObject.height) : undefined,
    fit: formObject.fit,
    compacted: formObject.compacted,
  });

  const uploadedFile = formObject.compacted as File;

  if (!uploadedFile) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const fileBuffer = await uploadedFile.arrayBuffer();

  try {
    const zip = new AdmZip(Buffer.from(fileBuffer));
    const outputZip = new AdmZip();

    const entries = zip.getEntries();

    for (const entry of entries) {
      if (!entry.isDirectory) {
        const fileExt = path.extname(entry.name).toLowerCase().slice(1);
        if (SUPPORTED_INPUT_FORMATS.includes(fileExt as SupportedInputFormats)) {
          const inputBuffer = entry.getData();
          const convertedBuffer = await ImageConvertr(
            inputBuffer,
            fileExt as SupportedInputFormats,
            validatedData.outputFormat,
            {
              quality: Number(validatedData.quality) || 80,
              width: Number(validatedData.width) || undefined,
              height: Number(validatedData.height) || undefined,
              fit: validatedData.fit || "contain",
            }
          );

          const newFileName = `${path.parse(entry.name).name}.${validatedData.outputFormat}`;
          const newFilePath = path.join(
            path.dirname(entry.entryName),
            newFileName);
          outputZip.addFile(newFilePath, convertedBuffer);
        } else {
          outputZip.addFile(entry.entryName, entry.getData());
        }
      } else {
        outputZip.addFile(entry.entryName, Buffer.alloc(0));
      }
    }

    const outputBuffer = outputZip.toBuffer();

    const response = new NextResponse(outputBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": 'attachment; filename="converted_images.zip"',
      },
    });

    return response;
  } catch (error) {
    console.error("Error processing images:", error);
    return NextResponse.json({ error: "Error processing images" }, { status: 500 });
  }
}
