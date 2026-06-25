import { motion } from 'framer-motion';
import { User, Building2, GraduationCap, Calendar } from 'lucide-react';

const STACK_PILLS = ['EfficientNet-B0', 'CBAM', 'CLAHE', 'FastAPI', 'React'];

const PIPELINE = ['Image Input', 'CLAHE', 'EfficientNet-B0', 'CBAM', 'Softmax', 'Result'];

const INFO = [
  { icon: User, label: 'Author', value: 'Balaji Nambi M' },
  { icon: Building2, label: 'Institution', value: 'Francis Xavier Engineering College' },
  { icon: GraduationCap, label: 'Degree', value: 'B.E. Computer Science Engineering' },
  { icon: Calendar, label: 'Date', value: 'June 2026' },
];

export default function About() {
  return (
    <section id="about" className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <h2 className="font-display text-3xl font-bold sm:text-4xl">About OraLens AI</h2>
          <p className="mt-3 text-muted">
            Deep learning system for early oral cancer detection
          </p>
        </motion.div>

        <div className="grid gap-8 lg:grid-cols-2">
          {/* Project info card */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <h3 className="mb-6 font-display text-xl font-bold">Project Information</h3>
            <div className="space-y-5">
              {INFO.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-4">
                  <div className="rounded-lg bg-surface p-2.5">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">
                      {label}
                    </p>
                    <p className="mt-0.5 font-medium">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8">
              <p className="mb-3 text-xs font-medium uppercase tracking-wider text-muted">
                Technology Stack
              </p>
              <div className="flex flex-wrap gap-2">
                {STACK_PILLS.map((pill) => (
                  <span
                    key={pill}
                    className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-primary"
                  >
                    {pill}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Pipeline diagram */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="rounded-2xl border border-border bg-card p-6 sm:p-8"
          >
            <h3 className="mb-6 font-display text-xl font-bold">Pipeline Architecture</h3>
            <div className="pipeline-flow">
              {PIPELINE.map((node, i) => (
                <span key={node} className="flex items-center gap-2">
                  <span className="pipeline-node">{node}</span>
                  {i < PIPELINE.length - 1 && (
                    <span className="pipeline-arrow" aria-hidden="true">
                      →
                    </span>
                  )}
                </span>
              ))}
            </div>

            <div className="mt-10 space-y-4 text-sm text-muted">
              <p>
                OraLens AI processes smartphone-captured oral cavity images through a
                clinically-inspired pipeline. Images are enhanced with CLAHE (Contrast Limited
                Adaptive Histogram Equalization) before classification by an EfficientNet-B0
                backbone augmented with CBAM attention modules.
              </p>
              <p>
                The system outputs three-class predictions — Healthy, OPMD (Oral Potentially
                Malignant Disorders), and Oral Cancer — with confidence scores and risk
                stratification to support early screening workflows.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
