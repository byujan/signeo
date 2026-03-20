import Link from "next/link";

export default function DashboardNotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Page not found
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          This page doesn&apos;t exist or has been moved.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Return to dashboard
        </Link>
      </div>
    </div>
  );
}
