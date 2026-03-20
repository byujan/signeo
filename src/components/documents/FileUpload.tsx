"use client";

import { useState, useRef } from "react";
import { Upload, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  file: File | null;
}

export function FileUpload({ onFileSelect, file }: FileUploadProps) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile?.type === "application/pdf") {
      onFileSelect(droppedFile);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) onFileSelect(selectedFile);
  }

  if (file) {
    return (
      <div className="flex items-center gap-3 p-4 rounded-lg border border-gray-200 bg-white">
        <FileText className="h-8 w-8 text-blue-500 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {file.name}
          </p>
          <p className="text-xs text-gray-500">
            {(file.size / (1024 * 1024)).toFixed(2)} MB
          </p>
        </div>
        <button
          onClick={() => onFileSelect(null as unknown as File)}
          className="text-sm text-gray-500 hover:text-red-500"
        >
          Remove
        </button>
      </div>
    );
  }

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => inputRef.current?.click()}
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-8 cursor-pointer transition-colors",
        dragOver
          ? "border-blue-400 bg-blue-50"
          : "border-gray-300 hover:border-gray-400 bg-gray-50"
      )}
    >
      <Upload className="h-8 w-8 text-gray-400 mb-3" />
      <p className="text-sm font-medium text-gray-700">
        Drop your PDF here or click to browse
      </p>
      <p className="text-xs text-gray-500 mt-1">PDF files up to 10MB</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        onChange={handleChange}
        className="hidden"
      />
    </div>
  );
}
