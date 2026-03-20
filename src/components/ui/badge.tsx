import { cn } from "@/lib/utils/cn";
import type { DocumentStatus, RecipientStatus } from "@/types";

const statusColors: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sent: "bg-blue-100 text-blue-700",
  viewed: "bg-yellow-100 text-yellow-700",
  partially_signed: "bg-orange-100 text-orange-700",
  completed: "bg-green-100 text-green-700",
  voided: "bg-red-100 text-red-700",
  expired: "bg-gray-100 text-gray-500",
  pending: "bg-gray-100 text-gray-700",
  notified: "bg-blue-100 text-blue-700",
  signed: "bg-green-100 text-green-700",
  declined: "bg-red-100 text-red-700",
};

export function StatusBadge({
  status,
  className,
}: {
  status: DocumentStatus | RecipientStatus;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize",
        statusColors[status] ?? "bg-gray-100 text-gray-700",
        className
      )}
    >
      {status.replace("_", " ")}
    </span>
  );
}
