"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import SignaturePadLib from "signature_pad";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Eraser } from "lucide-react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  type?: "signature" | "initials";
}

export function SignaturePad({
  onSave,
  onCancel,
  type = "signature",
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const padRef = useRef<SignaturePadLib | null>(null);
  const [mode, setMode] = useState<"draw" | "type">("draw");
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (canvasRef.current && mode === "draw") {
      const canvas = canvasRef.current;
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      const ctx = canvas.getContext("2d");
      if (ctx) ctx.scale(2, 2);

      padRef.current = new SignaturePadLib(canvas, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
      });

      return () => {
        padRef.current?.off();
      };
    }
  }, [mode]);

  const handleSave = useCallback(() => {
    if (mode === "draw") {
      if (padRef.current?.isEmpty()) return;
      const dataUrl = padRef.current!.toDataURL("image/png");
      onSave(dataUrl);
    } else {
      if (!typedText.trim()) return;
      // Render typed text to canvas
      const canvas = document.createElement("canvas");
      canvas.width = 600;
      canvas.height = 150;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "black";
      ctx.font = "italic 48px 'Georgia', serif";
      ctx.textBaseline = "middle";
      ctx.fillText(typedText, 20, canvas.height / 2);
      onSave(canvas.toDataURL("image/png"));
    }
  }, [mode, typedText, onSave]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b border-gray-200 pb-2">
        <button
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            mode === "draw"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setMode("draw")}
        >
          Draw
        </button>
        <button
          className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
            mode === "type"
              ? "bg-blue-100 text-blue-700 font-medium"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          onClick={() => setMode("type")}
        >
          Type
        </button>
      </div>

      {mode === "draw" ? (
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="w-full h-[150px] border border-gray-300 rounded-lg cursor-crosshair"
          />
          <button
            onClick={() => padRef.current?.clear()}
            className="absolute top-2 right-2 p-1.5 rounded-md bg-white/80 text-gray-500 hover:text-gray-700 border border-gray-200"
            title="Clear"
          >
            <Eraser className="h-4 w-4" />
          </button>
          <p className="text-xs text-gray-400 mt-1 text-center">
            Draw your {type} above
          </p>
        </div>
      ) : (
        <div>
          <Input
            value={typedText}
            onChange={(e) => setTypedText(e.target.value)}
            placeholder={`Type your ${type}`}
            className="text-2xl font-serif italic h-[60px]"
            autoFocus
          />
          {typedText && (
            <div className="mt-2 p-4 border border-gray-200 rounded-lg bg-white">
              <p className="text-3xl font-serif italic text-gray-900">
                {typedText}
              </p>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end">
        <Button variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        <Button onClick={handleSave}>
          Apply {type === "initials" ? "Initials" : "Signature"}
        </Button>
      </div>
    </div>
  );
}
