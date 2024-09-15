import sharp from "sharp";
import {
  SupportedInputFormats,
  SupportedOutputFormats,
} from "@/types/ImageTypes";

export interface ConversionOptions {
  quality?: number;
  width?: number;
  height?: number;
  fit?: keyof sharp.FitEnum;
}


export default async function ImageConvertr(
  inputBuffer: Buffer,
  inputFormat: SupportedInputFormats,
  outputFormat: SupportedOutputFormats,
  options: ConversionOptions = {}
): Promise<Buffer> {
  try {
    let sharpInstance = sharp(inputBuffer, { failOnError: false });

    if (options.width || options.height) {
      sharpInstance = sharpInstance.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || "contain",
      });
    }

    const quality = options.quality || 80;

    switch (outputFormat) {
      case "jpeg":
        return await sharpInstance.jpeg({ quality }).toBuffer();
      case "png":
        return await sharpInstance.png({ quality }).toBuffer();
      case "webp":
        return await sharpInstance.webp({ quality }).toBuffer();
      case "avif":
        return await sharpInstance.avif({ quality }).toBuffer();
      case "tiff":
        return await sharpInstance.tiff({ quality }).toBuffer();
      default:
        throw new Error("Unsupported output format");
    }
  } catch (error) {
    console.error("Error converting image:", error);
    throw error;
  }
}
