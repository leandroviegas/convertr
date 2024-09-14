"use client";

import { useState, FormEvent } from "react";
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
import Image from "next/image";

export default function ImageConverter() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [outputFormat, setOutputFormat] = useState<string>("png");
  const [convertedImage, setConvertedImage] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setSelectedFile(event.target.files[0]);
    }
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

    const formData = new FormData();
    formData.append("image", selectedFile);
    formData.append("outputFormat", outputFormat);

    try {
      const response = await fetch("/api/image-converter", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        const errors: { [key: string]: string } = {};
        if (result.errors && result.errors.length > 0) {
          result.errors.forEach(
            (element: { message: string; path: string[] }) => {
              element.path.forEach((path: string) => {
                errors[path] = element.message;
              });
            }
          );
        }

        if (result.message) {
          errors.general = result.message;
        }

        setErrors(errors);
        return;
      }

      const blob = await response.blob();
      const imageUrl = URL.createObjectURL(blob);
      setConvertedImage(imageUrl);
    } catch (err) {
      if (err instanceof Error) {
        setErrors({ general: err.message });
      } else {
        setErrors({ general: "An unknown error occurred" });
      }
    } finally {
      setIsLoading(false);
    }
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
        <div>
          <Label htmlFor="output-format">Output Format</Label>
          <Select onValueChange={setOutputFormat} defaultValue={outputFormat}>
            <SelectTrigger id="output-format" className="mt-1">
              <SelectValue placeholder="Select output format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="jpeg">JPG</SelectItem>
              <SelectItem value="webp">WebP</SelectItem>
            </SelectContent>
          </Select>
          {errors.outputFormat && (
            <p className="mt-1 text-red-500 text-sm">{errors.outputFormat}</p>
          )}
        </div>
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? "Converting..." : "Convert Image"}
        </Button>
      </form>
      {convertedImage && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">Converted Image:</h2>
          <Image
            src={convertedImage}
            alt="Converted"
            width={500}
            height={300}
            className="max-w-full h-auto rounded-lg shadow-md"
          />
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
