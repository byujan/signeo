import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  FileText,
  Send,
  Zap,
  CheckCircle2,
  Shield,
  Clock,
  ArrowRight,
  Upload,
  MousePointerClick,
  MailCheck,
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Nav */}
      <header className="sticky top-0 z-50 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Image
              src="/logo.png"
              alt="Signeo"
              width={30}
              height={30}
              className="rounded"
            />
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              Signeo
            </span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign in
              </Button>
            </Link>
            <Link href="/signup">
              <Button size="sm">Get started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-50/60 to-white" />
          <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-24 sm:pt-28 sm:pb-32 text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-4 py-1.5 text-sm text-blue-700 mb-8">
              <Zap className="h-3.5 w-3.5" />
              Free to get started
            </div>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight leading-[1.1]">
              Get documents signed
              <br />
              <span className="text-blue-600">in minutes, not days</span>
            </h1>
            <p className="mt-6 text-lg sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
              Upload a PDF, drop signature fields, add your signers, and hit
              send. Simple, secure e-signatures with zero learning curve.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/signup">
                <Button size="lg" className="w-full sm:w-auto text-base px-8">
                  Start signing for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
            <div className="mt-8 flex items-center justify-center gap-6 text-sm text-gray-400">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                No credit card required
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                Set up in 2 minutes
              </span>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-gray-100 bg-white py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                How it works
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Three steps. That&apos;s it.
              </h2>
            </div>
            <div className="grid sm:grid-cols-3 gap-8 sm:gap-12">
              {[
                {
                  step: "1",
                  icon: Upload,
                  title: "Upload your document",
                  description:
                    "Drag and drop any PDF. Your document is encrypted and stored securely.",
                },
                {
                  step: "2",
                  icon: MousePointerClick,
                  title: "Add signature fields",
                  description:
                    "Drag fields onto the document — signatures, dates, text, and more.",
                },
                {
                  step: "3",
                  icon: MailCheck,
                  title: "Send for signing",
                  description:
                    "Add your signers and hit send. They get a link and can sign from any device.",
                },
              ].map((item) => (
                <div key={item.step} className="relative text-center">
                  <div className="mx-auto h-14 w-14 rounded-2xl bg-blue-600 flex items-center justify-center mb-5 shadow-lg shadow-blue-600/20">
                    <item.icon className="h-6 w-6 text-white" />
                  </div>
                  <div className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 text-xs font-bold text-gray-500 mb-3">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs mx-auto">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t border-gray-100 bg-gray-50 py-20 sm:py-28">
          <div className="max-w-6xl mx-auto px-6">
            <div className="text-center mb-16">
              <p className="text-sm font-semibold text-blue-600 uppercase tracking-wide mb-3">
                Features
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                Everything you need, nothing you don&apos;t
              </h2>
              <p className="mt-4 text-gray-500 max-w-xl mx-auto">
                Built for speed and simplicity. No bloated feature lists or
                confusing pricing tiers.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: Zap,
                  title: "Instant setup",
                  description:
                    "Create an account and send your first document in under two minutes. No onboarding calls needed.",
                },
                {
                  icon: Send,
                  title: "One-click sending",
                  description:
                    "Add recipients, hit send, and they get a secure link to sign right from their inbox.",
                },
                {
                  icon: FileText,
                  title: "Drag-and-drop fields",
                  description:
                    "Place signature, date, text, and checkbox fields anywhere on your document.",
                },
                {
                  icon: Shield,
                  title: "Secure by default",
                  description:
                    "Documents are encrypted in transit and at rest. Signing links are unique and tamper-proof.",
                },
                {
                  icon: Clock,
                  title: "Real-time tracking",
                  description:
                    "See who has viewed and signed your documents. Get notified when signatures are completed.",
                },
                {
                  icon: CheckCircle2,
                  title: "Legally binding",
                  description:
                    "E-signatures that comply with ESIGN and UETA. Every signature includes an audit trail.",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="rounded-xl border border-gray-200 bg-white p-6 hover:shadow-md transition-shadow"
                >
                  <div className="h-10 w-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-base font-semibold text-gray-900 mb-1.5">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-500 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t border-gray-100 bg-white py-20 sm:py-28">
          <div className="max-w-2xl mx-auto px-6 text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
              Ready to ditch the paperwork?
            </h2>
            <p className="mt-4 text-lg text-gray-500">
              Join Signeo and start getting documents signed today. Free to get
              started, no credit card required.
            </p>
            <div className="mt-8">
              <Link href="/signup">
                <Button size="lg" className="text-base px-8">
                  Get started for free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Image
                src="/logo.png"
                alt="Signeo"
                width={22}
                height={22}
                className="rounded"
              />
              <span className="text-sm font-semibold text-gray-900">
                Signeo
              </span>
            </div>
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} Signeo. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
