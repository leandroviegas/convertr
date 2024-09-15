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
import { CompactedSchema } from "@/schemas/Image";
import { FaFileArchive } from "react-icons/fa";

export default function CompactedFileConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>("webp");
  const [quality, setQuality] = useState<string>("80");
  const [width, setWidth] = useState<string>("");
  const [height, setHeight] = useState<string>("");
  const [fit, setFit] = useState<string>("inside");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);
  const [originalSize, setOriginalSize] = useState<number | null>(null);
  const [convertedSize, setConvertedSize] = useState<number | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      setSelectedFile(file);
      setOriginalSize(file.size);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!selectedFile) {
      setErrors({ compacted: "Please select a ZIP file to convert" });
      return;
    }

    setIsLoading(true);
    setErrors({});
    setConvertedSize(null);

    try {
      const validatedData = CompactedSchema.parse({
        compacted: selectedFile,
        outputFormat,
        quality: quality ? Number(quality) : undefined,
        width: width ? Number(width) : undefined,
        height: height ? Number(height) : undefined,
        fit: fit || undefined,
      });

      const formData = new FormData();
      formData.append("compacted", validatedData.compacted);
      formData.append("outputFormat", validatedData.outputFormat);
      if (validatedData.quality)
        formData.append("quality", validatedData.quality.toString());
      if (validatedData.width)
        formData.append("width", validatedData.width.toString());
      if (validatedData.height)
        formData.append("height", validatedData.height.toString());
      if (validatedData.fit) formData.append("fit", validatedData.fit);

      const response = await fetch("/api/folder-images-converter", {
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
      setConvertedSize(blob.size);

      // Trigger download of the converted ZIP file
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'converted_images.zip';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
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
      <h1 className="text-2xl font-bold mb-6 text-center">Compacted File Converter</h1>
      {errors.general && (
        <p className="mt-1 text-red-500 text-sm">{errors.general}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="compacted-upload">Select ZIP File</Label>
          <Input
            id="compacted-upload"
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            className="mt-1"
          />
          {errors.compacted && (
            <p className="mt-1 text-red-500 text-sm">{errors.compacted}</p>
          )}
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
          <Label htmlFor="width">Width (optional)</Label>
          <Input
            id="width"
            type="number"
            min="1"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="mt-1"
          />
          {errors.width && (
            <p className="mt-1 text-red-500 text-sm">{errors.width}</p>
          )}
        </div>
        <div>
          <Label htmlFor="height">Height (optional)</Label>
          <Input
            id="height"
            type="number"
            min="1"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="mt-1"
          />
          {errors.height && (
            <p className="mt-1 text-red-500 text-sm">{errors.height}</p>
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
          {isLoading ? "Converting..." : "Convert Images"}
        </Button>
      </form>
      {convertedSize && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Conversion Complete</h2>
          <FaFileArchive className="text-6xl text-blue-500 mx-auto mb-4" />
          <div className="text-sm">
            <p>
              Original size: {originalSize ? formatSize(originalSize) : "N/A"}
            </p>
            <p>
              Converted size: {formatSize(convertedSize)}
            </p>
            {originalSize && (
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
          <p className="mt-2 text-green-600">
            The converted ZIP file has been downloaded automatically.
          </p>
        </div>
      )}
    </div>
  );
}
