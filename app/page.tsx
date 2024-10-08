"use client";

import { useState, FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUPPORTED_OUTPUT_FORMATS } from "@/types/ImageTypes";
import { ImageSchema } from "@/schemas/Image";
import ImageComponent from "next/image";
import { PiPlugsConnected } from "react-icons/pi";
import { VscDebugDisconnect } from "react-icons/vsc";

export default function ImageConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>("webp");
  const [quality, setQuality] = useState<string>("");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [fit, setFit] = useState<string>("inside");
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [convertedSize, setConvertedSize] = useState<number | null>(null);
  const [scaleMirrorMode, setScaleMirrorMode] = useState(false);
  const [originalWidth, setOriginalWidth] = useState<number | null>(null);
  const [originalHeight, setOriginalHeight] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setOriginalSize(file.size);

      // Create an image object to get the dimensions
      const img = new Image();
      img.onload = () => {
        setOriginalWidth(img.width);
        setOriginalHeight(img.height);
        setWidth(img.width.toString());
        setHeight(img.height.toString());
      };
      img.src = URL.createObjectURL(file);
    }
  };

  const handleWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newWidth = e.target.value;
    setWidth(newWidth);
    if (scaleMirrorMode && originalWidth && originalHeight) {
      const scale = parseInt(newWidth) / originalWidth;
      setHeight(Math.round(originalHeight * scale).toString());
    }
  };

  const handleHeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newHeight = e.target.value;
    setHeight(newHeight);
    if (scaleMirrorMode && originalWidth && originalHeight) {
      const scale = parseInt(newHeight) / originalHeight;
      setWidth(Math.round(originalWidth * scale).toString());
    }
  };

  const toggleScaleMirrorMode = () => {
    if (!scaleMirrorMode && originalWidth && originalHeight) {
      if (height > width) {
        const scale = parseInt(height) / originalHeight;
        setWidth(Math.round(originalWidth * scale).toString());
      } else {
        const scale = parseInt(width) / originalWidth;
        setHeight(Math.round(originalHeight * scale).toString());
      }
    }
    setScaleMirrorMode(!scaleMirrorMode);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setErrors({ image: "Please select a file to convert" });
      return;
    }

    setIsLoading(true);
    setErrors({});
    setConvertedImage(null);
    setConvertedSize(null);

    try {
      const validatedData = ImageSchema.parse({
        image: selectedFile,
        outputFormat,
        quality: quality ? Number(quality) : undefined,
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        fit: fit || undefined,
      });

      const formData = new FormData();
      formData.append("image", validatedData.image);
      formData.append("outputFormat", validatedData.outputFormat);
      if (validatedData.quality)
        formData.append("quality", validatedData.quality.toString());
      if (validatedData.width)
        formData.append("width", validatedData.width.toString());
      if (validatedData.height)
        formData.append("height", validatedData.height.toString());
      if (validatedData.fit) formData.append("fit", validatedData.fit);

      const response = await fetch("/api/image-converter", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();

        if (result.errors) {
          const backendErrors = z
            .array(
              z.object({
                code: z.string(),
                message: z.string(),
                path: z.array(z.string()),
              })
            )
            .parse(result.errors);

          const errors: { [key: string]: string } = {};
          backendErrors.forEach((error) => {
            const path = error.path.join(".");
            errors[path] = error.message;
          });

          setErrors(errors);
          return;
        }

        if (result.message) {
          setErrors({ general: result.message });
        }

        return;
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setConvertedImage(imageUrl);
      setConvertedSize(blob.size);
    } catch (err) {
      if (err instanceof z.ZodError) {
        const errors: { [key: string]: string } = {};
        err.errors.forEach((error) => {
          errors[error.path[0]] = error.message;
        });
        setErrors(errors);
      } else if (err instanceof Error) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: "An unknown error occurred" });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatSize = (size: number) => {
    if (size < 1024) return `${size} B`;
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(2)} KB`;
    return `${(size / (1024 * 1024)).toFixed(2)} MB`;
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6 bg-white rounded-lg shadow-md">
      <h1 className="text-2xl font-bold mb-6 text-center">Image Converter</h1>
      {errors.general && (
        <p className="mt-1 text-red-500 text-sm">{errors.general}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="image-upload">Select Image</Label>
          <Input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="mt-1"
          />
          {errors.image && (
            <p className="mt-1 text-red-500 text-sm">{errors.image}</p>
          )}
        </div>
        <div className="flex items-start justify-center space-x-4">
          <div className="flex-1">
            <Label htmlFor="width">Width</Label>
            <Input
              id="width"
              type="number"
              min="1"
              value={width}
              onChange={handleWidthChange}
              className="mt-1"
            />
            {errors.width && (
              <p className="mt-1 text-red-500 text-sm">{errors.width}</p>
            )}
          </div>
          <button
            type="button"
            className="mt-8"
            onClick={toggleScaleMirrorMode}
          >
            {scaleMirrorMode ? (
              <PiPlugsConnected className="w-6 h-6 text-gray-400 rotate-45" />
            ) : (
              <VscDebugDisconnect className="w-6 h-6 text-gray-400 rotate-45" />
            )}
          </button>
          <div className="flex-1">
            <Label htmlFor="height">Height</Label>
            <Input
              id="height"
              type="number"
              min="1"
              value={height}
              onChange={handleHeightChange}
              className="mt-1"
            />
            {errors.height && (
              <p className="mt-1 text-red-500 text-sm">{errors.height}</p>
            )}
          </div>
        </div>
        <div>
          <Label htmlFor="output-format">Output Format</Label>
          <Select onValueChange={setOutputFormat} defaultValue={outputFormat}>
            <SelectTrigger id="output-format" className="mt-1">
              <SelectValue placeholder="Select output format" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_OUTPUT_FORMATS.map((format) => (
                <SelectItem key={format} value={format}>
                  {format}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.outputFormat && (
            <p className="mt-1 text-red-500 text-sm">{errors.outputFormat}</p>
          )}
        </div>
        <div>
          <Label htmlFor="quality">Quality (1-100)</Label>
          <Input
            id="quality"
            type="number"
            min="1"
            max="100"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="mt-1"
          />
          {errors.quality && (
            <p className="mt-1 text-red-500 text-sm">{errors.quality}</p>
          )}
        </div>
        <div>
          <Label htmlFor="fit">Fit</Label>
          <Select onValueChange={setFit} defaultValue={fit}>
            <SelectTrigger id="fit" className="mt-1">
              <SelectValue placeholder="Select fit option" />
            </SelectTrigger>
            <SelectContent>
              {["cover", "contain", "fill", "inside", "outside"].map(
                (fitOption) => (
                  <SelectItem key={fitOption} value={fitOption}>
                    {fitOption}
                  </SelectItem>
                )
              )}
            </SelectContent>
          </Select>
          {errors.fit && (
            <p className="mt-1 text-red-500 text-sm">{errors.fit}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Converting..." : "Convert Image"}
        </Button>
      </form>
      {convertedImage && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Converted Image:</h2>
          <ImageComponent
            src={convertedImage}
            alt="Converted"
            width={500}
            height={300}
            className="max-w-full h-auto rounded-lg shadow-md"
          />
          <div className="mt-2 text-sm">
            <p>
              Original size: {originalSize ? formatSize(originalSize) : "N/A"}
            </p>
            <p>
              Converted size:{" "}
              {convertedSize ? formatSize(convertedSize) : "N/A"}
            </p>
            {originalSize && convertedSize && (
              <p>
                Size reduction:{" "}
                {(
                  ((originalSize - convertedSize) / originalSize) *
                  100
                ).toFixed(2)}
                %
              </p>
            )}
          </div>
          <a
            href={convertedImage}
            download={`converted_image.${outputFormat}`}
            className="mt-2 inline-block bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Download
          </a>
        </div>
      )}
    </div>
  );
}
