import { useState, useCallback } from 'react';
import { ClerkProvider, SignedIn, SignedOut, useUser } from '@clerk/clerk-react';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import UploadSection from './components/UploadSection';
import ResultsPanel from './components/ResultsPanel';
import ModelPerformance from './components/ModelPerformance';
import About from './components/About';
import Footer from './components/Footer';
import ErrorToast from './components/ErrorToast';
import ScanHistory from './components/ScanHistory';


function AppContent() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState('screening'); // 'screening', 'history', 'research'
  const [result, setResult] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError] = useState(null);

  const handleResult = useCallback((parsed, preview) => {
    setResult(parsed);
    setImagePreview(preview);
    setTimeout(() => {
      document.getElementById('results')?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  }, []);

  const handleError = useCallback((message) => {
    setError(message);
    setTimeout(() => setError(null), 8000);
  }, []);

  const handleReset = useCallback(() => {
    setResult(null);
    setImagePreview(null);
    document.getElementById('screen')?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  const handleUploadReset = useCallback(() => {
    setResult(null);
  }, []);

  const selectTab = useCallback((tab) => {
    setActiveTab(tab);
    setResult(null);
    setImagePreview(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  return (
    <div className="min-h-screen bg-bg text-text selection:bg-primary/30 selection:text-white">
      {/* Dynamic Glowing background nodes for clinical portal look */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[20%] right-[10%] h-[350px] w-[350px] rounded-full glow-orb-primary opacity-60" />
        <div className="absolute bottom-[20%] left-[5%] h-[400px] w-[400px] rounded-full glow-orb-healthy opacity-40" />
      </div>

      <div className="relative z-10 flex flex-col min-h-screen">
        <Navbar activeTab={activeTab} onTabChange={selectTab} />

        {/* Signed In Clinical Portal Workspace */}
        <SignedIn>
          <main className="flex-grow pt-20">
            {activeTab === 'screening' && (
              <>
                <UploadSection
                  onResult={handleResult}
                  onError={handleError}
                  onReset={handleUploadReset}
                  userId={user?.id}
                />
                <ResultsPanel
                  result={result}
                  imagePreview={imagePreview}
                  onReset={handleReset}
                  patientDetails={result?.patientDetails}
                />
              </>
            )}

            {activeTab === 'history' && (
              <ScanHistory userId={user?.id} />
            )}

            {activeTab === 'research' && (
              <>
                <ModelPerformance />
                <About />
              </>
            )}
          </main>
        </SignedIn>

        {/* Public Landing Page */}
        <SignedOut>
          <main className="flex-grow">
            <Hero />
            <UploadSection
              onResult={handleResult}
              onError={handleError}
              onReset={handleUploadReset}
            />
            <ResultsPanel
              result={result}
              imagePreview={imagePreview}
              onReset={handleReset}
            />
            <ModelPerformance />
            <About />
          </main>
        </SignedOut>

        <Footer />
        <ErrorToast message={error} onClose={() => setError(null)} />
      </div>
    </div>
  );
}

export default function App() {
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || localStorage.getItem('clerk_publishable_key');
  const hasValidKey = clerkKey && (clerkKey.trim().startsWith('pk_test_') || clerkKey.trim().startsWith('pk_live_'));

  if (!hasValidKey) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0f1e] text-white p-6 text-center">
        <div className="w-full max-w-md p-8 border border-red-500/20 bg-[#111827]/80 rounded-3xl shadow-2xl backdrop-blur-xl">
          <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10 text-red-500">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="font-display text-xl font-bold tracking-tight text-white">
            Clerk Key Missing or Invalid
          </h1>
          <p className="mt-3 text-sm text-gray-400">
            We couldn't detect a valid Clerk Publishable Key. Please add it to your <strong>.env</strong> file in the frontend folder:
          </p>
          <div className="mt-4 bg-black/50 p-4 rounded-xl text-left text-xs font-mono text-cyan-400 overflow-x-auto select-all">
            VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
          </div>
          <p className="mt-4 text-xs text-gray-500 leading-relaxed">
            Note: If you recently updated your <code>.env</code> file, you <strong>must restart your Vite development server</strong> (press <code>Ctrl+C</code> in the terminal and run <code>npm run dev</code> or <code>start-frontend.ps1</code> again) for Vite to load the new settings.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 flex w-full items-center justify-center rounded-xl bg-cyan-600 hover:bg-cyan-500 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all duration-300"
          >
            Reload Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkKey.trim()}>
      <AppContent />
    </ClerkProvider>
  );
}
