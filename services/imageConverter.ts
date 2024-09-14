import sharp from 'sharp';

export type SupportedInputFormats = 
  'jpeg'| 'jpg' | 'png' | 'webp' | 'tiff' | 'avif' | 'heif' | 'gif' | 'svg' | 'raw';

export type SupportedOutputFormats = 
  'jpeg' | 'png' | 'webp' | 'avif' | 'tiff' | 'heif';

export const SUPPORTED_INPUT_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'avif', 'heif', 'gif', 'svg', 'raw'] as const;
export const SUPPORTED_OUTPUT_FORMATS = ['jpeg', 'png', 'webp', 'avif', 'tiff', 'heif'] as const;

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

    // Apply resizing if width or height is specified
    if (options.width || options.height) {
      sharpInstance = sharpInstance.resize({
        width: options.width,
        height: options.height,
        fit: options.fit || 'contain'
      });
    }

    // Set default quality if not specified
    const quality = options.quality || 80;

    switch (outputFormat) {
      case 'jpeg':
        return await sharpInstance.jpeg({ quality }).toBuffer();
      case 'png':
        return await sharpInstance.png({ quality }).toBuffer();
      case 'webp':
        return await sharpInstance.webp({ quality }).toBuffer();
      case 'avif':
        return await sharpInstance.avif({ quality }).toBuffer();
      case 'tiff':
        return await sharpInstance.tiff({ quality }).toBuffer();
      case 'heif':
        return await sharpInstance.heif({ quality }).toBuffer();
      default:
        throw new Error('Unsupported output format');
    }
  } catch (error) {
    console.error('Error converting image:', error);
    throw error;
  }
}