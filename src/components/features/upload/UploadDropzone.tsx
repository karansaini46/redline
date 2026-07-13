"use client";

import React, { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { uploadContractAction } from "@/server/contracts/upload";
import {
  UploadCloud,
  File as FileIcon,
  AlertCircle,
  Loader2,
  X,
  FileCheck2,
  FileSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { FadeIn } from "@/components/ui/motion";

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
  const router = useRouter();

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
          } else if (result.contractId) {
            router.push(`/dashboard/contracts/${result.contractId}`);
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
    <div className="w-full max-w-2xl mx-auto mt-8">
      <motion.div
        animate={isDragActive ? { scale: 1.02, y: -4 } : { scale: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
        className={`relative rounded-3xl border-2 border-dashed p-12 transition-all duration-300 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          isDragActive
            ? "border-primary bg-primary/5 shadow-xl shadow-primary/10"
            : error
              ? "border-destructive/50 bg-destructive/5"
              : "border-border/60 hover:border-primary/50 bg-surface/50 backdrop-blur-sm hover:bg-surface shadow-sm"
        } ${isUploading ? "opacity-75 pointer-events-none" : "cursor-pointer"}`}
        tabIndex={isUploading || selectedFile ? -1 : 0}
        onClick={() =>
          !selectedFile && !isUploading && fileInputRef.current?.click()
        }
        onKeyDown={(e: any) => {
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

        <AnimatePresence mode="wait">
          {!selectedFile ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col items-center justify-center text-center"
            >
              <div className="mb-6 relative flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <UploadCloud className="h-10 w-10 text-primary" />
                {isDragActive && (
                  <motion.div 
                    className="absolute inset-0 rounded-full border-2 border-primary"
                    animate={{ scale: [1, 1.2, 1], opacity: [1, 0, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  />
                )}
              </div>
              <h3 className="mb-2 text-2xl font-bold tracking-tight">Upload your contract</h3>
              <p className="mb-6 text-base text-muted-foreground max-w-sm">
                Drag and drop your file here, or click to browse. We will automatically extract clauses and assess risks.
              </p>
              <Button
                size="lg"
                className="rounded-full shadow-md"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current?.click();
                }}
                disabled={isUploading}
              >
                Select File
              </Button>
              <p className="mt-4 text-xs font-medium text-muted-foreground/80">
                Supports PDF and DOCX up to 20MB
              </p>
            </motion.div>
          ) : (
            <motion.div
              key="file"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col w-full max-w-md mx-auto"
            >
              <div className="flex items-center justify-between rounded-xl border bg-background p-4 shadow-sm mb-6">
                <div className="flex items-center space-x-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    {isUploading ? (
                      <FileSearch className="h-6 w-6 text-primary animate-pulse" />
                    ) : (
                      <FileCheck2 className="h-6 w-6 text-primary" />
                    )}
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-semibold truncate max-w-[200px] sm:max-w-[250px]">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs font-medium text-muted-foreground">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  </div>
                </div>
                {!isUploading && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      clearFile();
                    }}
                    className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>

              {isUploading ? (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center text-primary font-semibold">
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing Document...
                    </span>
                    <span className="text-primary font-bold">{progress}%</span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className="h-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>
              ) : (
                <div className="flex justify-center space-x-4">
                  <Button variant="outline" size="lg" className="rounded-full" onClick={(e) => { e.stopPropagation(); clearFile(); }}>
                    Cancel
                  </Button>
                  <Button size="lg" className="rounded-full shadow-md" onClick={(e) => { e.stopPropagation(); handleUpload(); }}>
                    Confirm Upload
                  </Button>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {error && (
          <FadeIn className="mt-6 flex items-center justify-center space-x-2 rounded-lg bg-destructive/10 p-3 text-sm font-medium text-destructive">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </FadeIn>
        )}
      </motion.div>
    </div>
  );
}
