import { motion } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';

const STEPS = [
  'Uploading image...',
  'Applying CLAHE Enhancement...',
  'Running EfficientNet-B0 + CBAM...',
  'Generating classification...',
];

export default function LoadingSteps({ activeStep }) {
  return (
    <div className="mt-6 space-y-3">
      {STEPS.map((step, index) => {
        const isActive = index === activeStep;
        const isComplete = index < activeStep;
        const isPending = index > activeStep;

        return (
          <motion.div
            key={step}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-all duration-300 ${
              isActive
                ? 'border-primary/50 bg-primary/10'
                : isComplete
                  ? 'border-healthy/30 bg-healthy/5'
                  : 'border-border bg-surface/50 opacity-50'
            }`}
          >
            <div
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${
                isComplete
                  ? 'bg-healthy/20 text-healthy'
                  : isActive
                    ? 'bg-primary/20 text-primary'
                    : 'bg-card text-muted'
              }`}
            >
              {isComplete ? (
                <Check className="h-4 w-4" />
              ) : isActive ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="text-xs font-bold">{index + 1}</span>
              )}
            </div>
            <span
              className={`text-sm font-medium ${
                isPending ? 'text-muted' : isActive ? 'text-primary' : 'text-healthy'
              }`}
            >
              Step {index + 1}: {step}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}
