"use client";

export default function SigningError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center max-w-sm">
        <h1 className="text-xl font-semibold text-gray-900 mb-2">
          Unable to load the signing page
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Something went wrong while loading the document. Please check your
          connection and try again, or contact the sender for a new signing
          link.
        </p>
        <button
          onClick={reset}
          className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
