"use client";

import { Button } from "@/components/ui/button";

interface ConsentBannerProps {
  onAccept: () => void;
  loading?: boolean;
  recipientName: string;
}

export function ConsentBanner({
  onAccept,
  loading,
  recipientName,
}: ConsentBannerProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50">
      <div className="max-w-3xl mx-auto px-4 py-4">
        <div className="flex items-start gap-4">
          <div className="flex-1">
            <p className="text-sm text-gray-900 font-medium">
              Electronic Signature Consent
            </p>
            <p className="text-xs text-gray-500 mt-1">
              By clicking &ldquo;Adopt &amp; Sign&rdquo;, I, {recipientName},
              agree that my electronic signature is the legal equivalent of my
              manual signature on this document. I consent to be legally bound by
              this document&apos;s terms.
            </p>
          </div>
          <Button onClick={onAccept} loading={loading} size="lg">
            Adopt &amp; Sign
          </Button>
        </div>
      </div>
    </div>
  );
}
