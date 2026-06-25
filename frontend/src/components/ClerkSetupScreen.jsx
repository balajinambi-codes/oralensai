import { useState } from 'react';
import { motion } from 'framer-motion';
import { Key, Eye, EyeOff, ShieldAlert, ArrowRight, Dna } from 'lucide-react';
import { saveClerkPublishableKey } from '../utils/clerkSetup';

export default function ClerkSetupScreen() {
  const [key, setKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    const trimmedKey = key.trim();
    if (!trimmedKey) {
      setError('Please enter your Clerk Publishable Key.');
      return;
    }

    if (!trimmedKey.startsWith('pk_test_') && !trimmedKey.startsWith('pk_live_')) {
      setError('Invalid key format. Clerk Publishable Keys must start with "pk_test_" or "pk_live_".');
      return;
    }

    const saved = saveClerkPublishableKey(trimmedKey);
    if (saved) {
      setSuccess(true);
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setError('Failed to save the key. Please verify the key format.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0f1e] px-4 py-6 sm:px-6">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[40%] left-[20%] h-[80%] w-[60%] rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute -bottom-[30%] right-[10%] h-[70%] w-[50%] rounded-full bg-healthy/5 blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-[#111827]/80 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-semibold text-primary">
            <Dna className="h-5 w-5 animate-pulse" />
            OraLens AI Setup
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Configure Clerk Authentication
          </h1>
          <p className="mt-3 text-sm text-muted">
            Set up Clerk to enable secure user authentication and clinical scan history.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="clerk-key" className="block text-xs font-semibold uppercase tracking-wider text-muted">
              Clerk Publishable Key
            </label>
            <div className="relative mt-2">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
                <Key className="h-4 w-4" />
              </span>
              <input
                id="clerk-key"
                type={showKey ? 'text' : 'password'}
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="pk_test_..."
                className="w-full rounded-xl border border-border bg-surface py-3 pl-10 pr-10 text-sm text-white placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                disabled={success}
              />
              <button
                type="button"
                onClick={() => setShowKey(!showKey)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted hover:text-white"
                disabled={success}
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {error && (
              <div className="mt-3 flex items-start gap-2 text-xs text-cancer">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={success}
            className={`flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold transition-all duration-300 ${
              success
                ? 'bg-healthy text-white'
                : 'bg-primary text-white shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-primary/40'
            }`}
          >
            {success ? (
              <span>Saved! Reloading App...</span>
            ) : (
              <>
                <span>Save Publishable Key</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 border-t border-border/50 pt-6">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted">How to get your key:</h2>
          <ol className="mt-3 space-y-2.5 text-xs text-muted">
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-border text-center font-bold text-white">1</span>
              <span>Go to your <a href="https://dashboard.clerk.com" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Clerk Dashboard</a> and create a new project.</span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-border text-center font-bold text-white">2</span>
              <span>Enable <b>Google Social Login</b> in the User & Authentication Settings.</span>
            </li>
            <li className="flex gap-2">
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-border text-center font-bold text-white">3</span>
              <span>Copy the <b>Publishable key</b> from the API Keys tab and paste it above.</span>
            </li>
          </ol>
        </div>
      </motion.div>
    </div>
  );
}
