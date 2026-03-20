"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

// Configure pdf.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface PdfViewerProps {
  url: string;
  currentPage: number;
  onPageChange: (page: number) => void;
  onPageDimensions?: (width: number, height: number) => void;
  overlay?: React.ReactNode;
  width?: number;
}

export function PdfViewer({
  url,
  currentPage,
  onPageChange,
  onPageDimensions,
  overlay,
}: PdfViewerProps) {
  const [numPages, setNumPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredWidth, setMeasuredWidth] = useState<number | undefined>(undefined);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setMeasuredWidth(containerRef.current.clientWidth);
      }
    }
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const onDocumentLoadSuccess = useCallback(
    ({ numPages: n }: { numPages: number }) => {
      setNumPages(n);
      setLoading(false);
    },
    []
  );

  const onPageLoadSuccess = useCallback(
    (page: { width: number; height: number }) => {
      onPageDimensions?.(page.width, page.height);
    },
    [onPageDimensions]
  );

  return (
    <div ref={containerRef} className="w-full max-w-[800px] flex flex-col items-center">
      <Document
        file={url}
        onLoadSuccess={onDocumentLoadSuccess}
        loading={
          <div className="flex items-center justify-center h-[600px] w-full bg-gray-50 rounded-lg">
            <p className="text-gray-500">Loading PDF...</p>
          </div>
        }
      >
        <div className="relative border border-gray-200 shadow-sm bg-white">
          <Page
            pageNumber={currentPage}
            width={measuredWidth}
            onLoadSuccess={onPageLoadSuccess}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
          {/* Field overlay positioned absolutely over the page */}
          {overlay && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="relative w-full h-full pointer-events-auto">
                {overlay}
              </div>
            </div>
          )}
        </div>
      </Document>

      {!loading && numPages > 1 && (
        <div className="flex items-center gap-4 mt-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {numPages}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onPageChange(Math.min(numPages, currentPage + 1))}
            disabled={currentPage >= numPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
