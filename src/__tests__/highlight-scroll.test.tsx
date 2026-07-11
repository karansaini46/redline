import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { DocumentViewer } from "../app/(dashboard)/contracts/[id]/_components/DocumentViewer";
import React from "react";

// Mock react-pdf since it relies on browser canvas APIs not fully supported in jsdom
vi.mock("react-pdf", () => {
  return {
    pdfjs: { GlobalWorkerOptions: { workerSrc: "" } },
    Document: ({ children, onLoadSuccess }: any) => {
      // Simulate successful load with 2 pages
      React.useEffect(() => {
        if (onLoadSuccess) {
          onLoadSuccess({ numPages: 2 });
        }
      }, [onLoadSuccess]);
      return React.createElement("div", { "data-testid": "pdf-document" }, children);
    },
    Page: ({ pageNumber, customTextRenderer }: any) => {
      // Simulate text rendering
      const mockTextItem = { str: "This agreement shall remain in effect for a period of five years." };
      const renderedText = customTextRenderer ? customTextRenderer(mockTextItem) : mockTextItem.str;
      
      return React.createElement(
        "div",
        { "data-testid": `pdf-page-${pageNumber}` },
        renderedText
      );
    },
  };
});

describe("DocumentViewer Highlight and Scroll Interaction", () => {
  const scrollIntoViewMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;
  });

  it("should highlight the text with correct offsets and scroll to the page when a clause is selected", async () => {
    const mockSelectedClause = {
      id: "clause-1",
      text: "This agreement shall remain in effect",
      page_number: 2,
      char_start: 100,
      char_end: 137,
    };

    render(
      <DocumentViewer
        fileUrl="dummy.pdf"
        selectedClause={mockSelectedClause}
      />
    );

    // Wait for the document to "load" and pages to render
    await waitFor(() => {
      expect(screen.getByTestId("pdf-document")).toBeDefined();
    });

    // Check if the scrollIntoView was called (because page_number is 2)
    // In useEffect, it looks for element id `page-2`. Since we mock it, the element might not have the id unless we added it in DocumentViewer.
    // DocumentViewer wraps Page in `<div id="page-2">`.
    await waitFor(() => {
      expect(scrollIntoViewMock).toHaveBeenCalledWith({ behavior: "smooth", block: "center" });
    });

    // Verify the highlight is applied using the custom text renderer
    const highlights = screen.getAllByTestId("clause-highlight");
    expect(highlights.length).toBeGreaterThan(0);
    
    const highlight = highlights[0];
    
    // Check if the correct offset attributes are applied
    expect(highlight.getAttribute("data-char-start")).toBe("100");
    expect(highlight.getAttribute("data-char-end")).toBe("137");
    expect(highlight.getAttribute("data-page-number")).toBe("2");
    
    // Check if it has the ease-out transition class
    expect(highlight.className).toContain("transition-all");
    expect(highlight.className).toContain("duration-200");
    expect(highlight.className).toContain("ease-out");
  });
});
