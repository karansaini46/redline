"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { Loader2 } from "lucide-react";

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface DocumentViewerProps {
  fileUrl: string;
  selectedClause?: any;
}

export function DocumentViewer({ fileUrl, selectedClause }: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>();
  const containerRef = useRef<HTMLDivElement>(null);
  
  function onDocumentLoadSuccess({ numPages }: { numPages: number }): void {
    setNumPages(numPages);
  }

  // Scroll to page when a clause is selected or when document finishes loading
  useEffect(() => {
    if (selectedClause?.page_number && containerRef.current) {
      // Small timeout to ensure DOM has updated after numPages is set
      setTimeout(() => {
        const pageElement = document.getElementById(`page-${selectedClause.page_number}`);
        if (pageElement) {
          pageElement.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }, 0);
    }
  }, [selectedClause?.id, selectedClause?.page_number, numPages]);

  const customTextRenderer = useCallback(
    (textItem: any) => {
      if (!selectedClause || !selectedClause.text) return textItem.str;
      
      const clauseText = selectedClause.text.replace(/\s+/g, " ");
      const itemStr = textItem.str.replace(/\s+/g, " ");
      
      // Basic matching: if a significant portion of the text item is in the clause text
      if (itemStr.length >= 4 && (clauseText.includes(itemStr) || itemStr.includes(clauseText))) {
        return (
          <mark 
            className="bg-yellow-300/60 rounded-sm text-transparent transition-all duration-200 ease-out py-0.5"
            data-testid="clause-highlight"
            data-page-number={selectedClause.page_number}
            data-char-start={selectedClause.char_start}
            data-char-end={selectedClause.char_end}
          >
            {textItem.str}
          </mark>
        );
      }
      
      return textItem.str;
    },
    [selectedClause?.id, selectedClause?.text] // Recompute when selected clause changes
  );

  return (
    <div 
      className="w-full h-full overflow-y-auto bg-muted/30 p-8 flex flex-col items-center"
      ref={containerRef}
    >
      <Document
        file={fileUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Loading document...</p>
          </div>
        }
        error={
          <div className="flex flex-col items-center justify-center h-64 text-red-500">
            <p>Failed to load the PDF document.</p>
          </div>
        }
        className="max-w-full"
      >
        {Array.from(new Array(numPages), (el, index) => (
          <div 
            key={`page_${index + 1}`} 
            id={`page-${index + 1}`}
            className="mb-6 shadow-xl rounded-sm overflow-hidden bg-white"
          >
            <Page
              pageNumber={index + 1}
              width={800} // Fixed width for consistent rendering, could be dynamic
              renderTextLayer={true}
              renderAnnotationLayer={false}
              customTextRenderer={customTextRenderer}
            />
          </div>
        ))}
      </Document>
    </div>
  );
}
