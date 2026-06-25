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
  // Fallback testing key to prevent Clerk from crashing if the environment variable is missing/uninitialized.
  // This allows the public landing page and AI scanning features to work out of the box.
  const clerkKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY || 'pk_test_ZW1wdHktY2xlcmstcHVibGlzaGFibGUta2V5LmNsZXJrLmFjY291bnRzLmRldiQ';

  return (
    <ClerkProvider publishableKey={clerkKey}>
      <AppContent />
    </ClerkProvider>
  );
}
