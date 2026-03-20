import { cn } from "@/lib/utils/cn";

interface LogoProps {
  className?: string;
  size?: number;
  showText?: boolean;
}

/**
 * Signeo logo — rounded square with a signature-style S stroke.
 */
export function Logo({ className, size = 28, showText = true }: LogoProps) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        {/* Background */}
        <rect x="2" y="2" width="28" height="28" rx="7" fill="#2563EB" />
        {/* Signature S-stroke */}
        <path
          d="M20 10c-2-1.5-5-1-6 1s1 3.5 3 4 4 2 3 4.5-4 2.5-6 1"
          stroke="white"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
      </svg>
      {showText && (
        <span className="text-lg font-bold text-gray-900 tracking-tight">
          Signeo
        </span>
      )}
    </span>
  );
}
