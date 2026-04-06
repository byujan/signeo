import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

export function Logo({ className, size = 28, showText = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <Image
        src="/logo.png"
        alt="Signeo"
        width={size}
        height={size}
        className="rounded"
      />
      {showText && (
        <span className="text-lg font-bold text-gray-900 tracking-tight">
          Signeo
        </span>
      )}
    </span>
  );
}
