import { prisma } from "@/lib/prisma";
import { UploadDropzone } from "@/components/features/upload/UploadDropzone";
import { FadeIn } from "@/components/ui/motion";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload Contract",
  description:
    "Securely upload your legal documents for AI-powered processing.",
};

export default async function UploadPage() {
  const org = await prisma.organization.findFirst();

  if (!org) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <h2 className="text-2xl font-bold">No Organization Found</h2>
        <p className="text-muted-foreground mt-2">
          Please seed the database with an organization first.
        </p>
      </div>
    );
  }

  return (
    <FadeIn className="flex flex-col gap-6 w-full max-w-3xl mx-auto pt-8">
      <div className="flex flex-col gap-1 text-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Upload Contract
        </h1>
        <p className="text-sm text-muted-foreground">
          Upload a new document (PDF or DOCX) to analyze clauses and track
          obligations.
        </p>
      </div>

      <div className="mt-4">
        <UploadDropzone orgId={org.id} />
      </div>
    </FadeIn>
  );
}
