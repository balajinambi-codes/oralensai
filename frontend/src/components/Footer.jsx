import { Dna } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
          <div className="flex items-center gap-2">
            <Dna className="h-6 w-6 text-primary" />
            <span className="font-display text-lg font-bold">OraLens AI</span>
          </div>
          <p className="text-sm text-muted">
            © {new Date().getFullYear()} OraLens AI. All rights reserved.
          </p>
        </div>

        <div className="mt-6 rounded-xl border border-border bg-card px-4 py-3 text-center">
          <p className="text-xs leading-relaxed text-muted">
            <strong className="text-opmd">Medical Disclaimer:</strong> OraLens AI is a screening
            assistance tool and does not provide medical diagnosis. Results should be interpreted
            by qualified healthcare professionals. Always consult a licensed physician for
            clinical evaluation and treatment decisions.
          </p>
        </div>
      </div>
    </footer>
  );
}
