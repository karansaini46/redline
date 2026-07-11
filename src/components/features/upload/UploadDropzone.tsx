"use client";

import React, { useState, useCallback, useRef } from "react";
import { uploadContractAction } from "@/server/contracts/upload";
import {
  UploadCloud,
  File as FileIcon,
  AlertCircle,
  Loader2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface UploadDropzoneProps {
  orgId: string;
  contractId?: string;
  onUploadComplete?: (contractId: string, versionId: string) => void;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20 MB
const ALLOWED_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

export function UploadDropzone({
  orgId,
  contractId,
  onUploadComplete,
}: UploadDropzoneProps) {
  const [isDragActive, setIsDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  }, []);

  const validateFile = (file: File): boolean => {
    setError(null);
    if (file.size > MAX_FILE_SIZE) {
      setError(`File ${file.name} is too large. Maximum size is 20MB.`);
      return false;
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      setError(
        `File ${file.name} is not a valid format. Only PDF and DOCX are allowed.`,
      );
      return false;
    }
    return true;
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragActive(false);
      if (isUploading) return;

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0];
        if (validateFile(file)) {
          setSelectedFile(file);
        }
      }
    },
    [isUploading],
  );

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (isUploading) return;

    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  const simulateProgress = () => {
    setProgress(0);
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) {
          clearInterval(interval);
          return 90;
        }
        return prev + 10;
      });
    }, 500);
    return interval;
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    setError(null);

    const interval = simulateProgress();

    try {
      const formData = new FormData();
      formData.append("orgId", orgId);
      if (contractId) {
        formData.append("contractId", contractId);
      }
      formData.append("file", selectedFile);

      const initialState = { success: false };
      const result = await uploadContractAction(initialState, formData);

      if (!result.success) {
        setError(result.error || "Upload failed");
      } else {
        setProgress(100);
        setTimeout(() => {
          setSelectedFile(null);
          if (onUploadComplete && result.contractId && result.versionId) {
            onUploadComplete(result.contractId, result.versionId);
          }
        }, 500);
      }
    } catch (err) {
      const error = err as Error;
      setError(error.message || "An unexpected error occurred during upload");
    } finally {
      clearInterval(interval);
      setIsUploading(false);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    setError(null);
    setProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        className={`relative rounded-xl border-2 border-dashed p-8 transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isDragActive
            ? "border-blue-500 bg-blue-50/50 dark:bg-blue-900/10"
            : error
              ? "border-red-300 bg-red-50/30 dark:border-red-900 dark:bg-red-900/10"
              : "border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700"
        } ${isUploading ? "opacity-75 pointer-events-none" : "cursor-pointer"}`}
        tabIndex={isUploading || selectedFile ? -1 : 0}
        onClick={() =>
          !selectedFile && !isUploading && fileInputRef.current?.click()
        }
        onKeyDown={(e) => {
          if (e.key === "Enter" && !selectedFile && !isUploading) {
            e.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          onChange={handleChange}
          disabled={isUploading}
        />

        {!selectedFile ? (
          <div className="flex flex-col items-center justify-center text-center">
            <div className="mb-4 rounded-full bg-gray-100 p-4 dark:bg-gray-800">
              <UploadCloud className="h-8 w-8 text-gray-500 dark:text-gray-400" />
            </div>
            <h3 className="mb-1 text-lg font-semibold">Upload Contract</h3>
            <p className="mb-4 text-sm text-gray-500 dark:text-gray-400">
              Drag and drop your file here, or click to browse
            </p>
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              Select File
            </Button>
            <p className="mt-4 text-xs text-gray-400 dark:text-gray-500">
              Supports PDF and DOCX up to 20MB
            </p>
          </div>
        ) : (
          <div className="flex flex-col">
            <div className="flex items-center justify-between rounded-lg border p-4 dark:border-gray-800">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-blue-100 p-2 dark:bg-blue-900/30">
                  <FileIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-medium truncate max-w-[200px] sm:max-w-[300px]">
                    {selectedFile.name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
              </div>
              {!isUploading && (
                <button
                  onClick={clearFile}
                  className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {isUploading && (
              <div className="mt-4 flex flex-col space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="flex items-center text-blue-600 dark:text-blue-400 font-medium">
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </span>
                  <span className="text-gray-500 font-medium">{progress}%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
                  <div
                    className="h-full bg-blue-600 transition-all duration-300 ease-out dark:bg-blue-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            )}

            {!isUploading && (
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="outline" onClick={clearFile}>
                  Cancel
                </Button>
                <Button onClick={handleUpload}>Upload File</Button>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-4 flex items-center space-x-2 rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-900/20 dark:text-red-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
}
