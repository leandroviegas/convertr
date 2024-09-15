export type SupportedInputFormats = 
  'jpeg'| 'jpg' | 'png' | 'webp' | 'tiff' | 'avif' | 'heif' | 'gif' | 'svg' | 'raw';

export type SupportedOutputFormats = 
  'jpeg' | 'png' | 'webp' | 'avif' | 'tiff';

export const SUPPORTED_INPUT_FORMATS = ['jpeg', 'jpg', 'png', 'webp', 'tiff', 'avif', 'heif', 'gif', 'svg', 'raw'] as const;
export const SUPPORTED_OUTPUT_FORMATS = ['jpeg', 'png', 'webp', 'avif', 'tiff'] as const;

