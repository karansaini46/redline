"use client";

import React from "react";
import { motion } from "framer-motion";
import {
  UploadCloud,
  FileText,
  BrainCircuit,
  CheckCircle2,
} from "lucide-react";
import { StaggerContainer, StaggerItem, FadeIn } from "@/components/ui/motion";

const STAGES = [
  { id: "upload", label: "Uploaded", icon: UploadCloud, status: "complete" },
  { id: "extract", label: "Extracting", icon: FileText, status: "complete" },
  { id: "score", label: "AI Scoring", icon: BrainCircuit, status: "active" },
  { id: "done", label: "Complete", icon: CheckCircle2, status: "pending" },
];

export function AIProcessingTimeline() {
  return (
    <div className="w-full relative py-4">
      <div className="absolute top-8 left-[10%] right-[10%] h-0.5 bg-muted rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-primary"
          initial={{ width: "0%" }}
          animate={{ width: "65%" }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </div>

      <StaggerContainer className="relative flex justify-between w-full">
        {STAGES.map((stage) => {
          const isActive = stage.status === "active";
          const isComplete = stage.status === "complete";

          return (
            <StaggerItem
              key={stage.id}
              className="flex flex-col items-center gap-3 relative z-10"
            >
              <motion.div
                className={`flex items-center justify-center size-10 rounded-full border-2 transition-colors duration-300 ${
                  isComplete
                    ? "bg-primary border-primary text-primary-foreground"
                    : isActive
                      ? "bg-background border-primary text-primary"
                      : "bg-background border-muted text-muted-foreground"
                }`}
                animate={
                  isActive
                    ? {
                        scale: [1, 1.1, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(var(--primary), 0)",
                          "0 0 0 8px rgba(var(--primary), 0.2)",
                          "0 0 0 0 rgba(var(--primary), 0)",
                        ],
                      }
                    : {}
                }
                transition={isActive ? { duration: 2, repeat: Infinity } : {}}
              >
                <stage.icon className="size-5" />
              </motion.div>
              <div className="text-center">
                <p
                  className={`text-sm font-medium ${isComplete || isActive ? "text-foreground" : "text-muted-foreground"}`}
                >
                  {stage.label}
                </p>
                {isActive && (
                  <FadeIn delay={0.5}>
                    <p className="text-xs text-primary animate-pulse mt-0.5">
                      Processing...
                    </p>
                  </FadeIn>
                )}
              </div>
            </StaggerItem>
          );
        })}
      </StaggerContainer>
    </div>
  );
}
