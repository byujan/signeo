import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileText, Send, Zap } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Nav */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              width="28"
              height="28"
              viewBox="0 0 32 32"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect x="2" y="2" width="28" height="28" rx="7" fill="#2563EB" />
              <path
                d="M20 10c-2-1.5-5-1-6 1s1 3.5 3 4 4 2 3 4.5-4 2.5-6 1"
                stroke="white"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
            </svg>
            <span className="text-lg font-semibold text-gray-900">Signeo</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Sign up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="max-w-5xl mx-auto px-6 py-24 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 tracking-tight">
            Get documents signed
            <br />
            in minutes, not days
          </h1>
          <p className="mt-4 text-lg text-gray-500 max-w-xl mx-auto">
            Upload a PDF, add signers, and hit send.
            No fuss, no learning curve.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/signup">
              <Button size="lg">Get started free</Button>
            </Link>
            <Link href="/login">
              <Button variant="secondary" size="lg">
                Sign in
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-200 bg-white py-20">
          <div className="max-w-5xl mx-auto px-6 grid sm:grid-cols-3 gap-10">
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Instant setup
              </h3>
              <p className="text-sm text-gray-500">
                Create an account and send your first document for signing
                in under two minutes.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <Send className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                One-click sending
              </h3>
              <p className="text-sm text-gray-500">
                Add recipients, hit send, and they get a link to sign
                right from their inbox.
              </p>
            </div>
            <div className="text-center">
              <div className="mx-auto h-12 w-12 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-base font-semibold text-gray-900 mb-1">
                Zero learning curve
              </h3>
              <p className="text-sm text-gray-500">
                Upload a PDF, drag fields onto it, add signers, and
                you&apos;re done. Nothing else to learn.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white py-8">
        <p className="text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Signeo. All rights reserved.
        </p>
      </footer>
    </div>
  );
}
