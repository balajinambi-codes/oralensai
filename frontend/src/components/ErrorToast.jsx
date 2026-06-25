import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle } from 'lucide-react';

export default function ErrorToast({ message, onClose }) {
  return (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, y: 50, x: '-50%' }}
          animate={{ opacity: 1, y: 0, x: '-50%' }}
          exit={{ opacity: 0, y: 50, x: '-50%' }}
          className="fixed bottom-6 left-1/2 z-[100] flex max-w-md items-start gap-3 rounded-xl border border-cancer/30 bg-surface px-4 py-3 shadow-xl"
        >
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-cancer" />
          <p className="flex-1 text-sm text-text">{message}</p>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 rounded p-1 text-muted hover:text-text"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
