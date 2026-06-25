import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Trash2, 
  Eye, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  Sparkles, 
  FolderHeart, 
  X,
  Printer
} from 'lucide-react';
import { getScanHistory, deleteScanRecord, clearScanHistory } from '../utils/historyDb';
import { getClassificationColor, getRiskColor } from '../utils/parseResponse';

export default function ScanHistory({ userId }) {
  const [history, setHistory] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRisk, setFilterRisk] = useState('All');
  const [selectedScan, setSelectedScan] = useState(null);
  const [loading, setLoading] = useState(false);

  const loadHistory = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const data = await getScanHistory(userId);
      setHistory(data);
    } catch (e) {
      console.error('Failed to load history:', e);
    } finally {
      setLoading(false);
    }
  };

  // Load history on mount or when userId changes
  useEffect(() => {
    loadHistory();
  }, [userId]);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this scan log?')) {
      setLoading(true);
      try {
        await deleteScanRecord(id, userId);
        const data = await getScanHistory(userId);
        setHistory(data);
        if (selectedScan?.id === id) {
          setSelectedScan(null);
        }
      } catch (e) {
        console.error('Failed to delete scan:', e);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Are you sure you want to clear ALL your screening records? This cannot be undone.')) {
      setLoading(true);
      try {
        await clearScanHistory(userId);
        const data = await getScanHistory(userId);
        setHistory(data);
        setSelectedScan(null);
      } catch (e) {
        console.error('Failed to clear history:', e);
      } finally {
        setLoading(false);
      }
    }
  };


  // Filter history based on search and dropdown filters
  const filteredHistory = history.filter((item) => {
    const matchesSearch = 
      item.patientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.classification.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRisk = filterRisk === 'All' || item.riskLevel === filterRisk;
    
    return matchesSearch && matchesRisk;
  });

  // Calculate statistics
  const totalScans = history.length;
  const highRiskCount = history.filter((item) => item.riskLevel === 'High').length;
  const moderateRiskCount = history.filter((item) => item.riskLevel === 'Moderate').length;
  const avgConfidence = totalScans > 0 
    ? history.reduce((sum, item) => sum + item.confidence, 0) / totalScans 
    : 0;

  // Print function inside history view
  const handlePrintReport = (scan) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const badgeColor = getClassificationColor(scan.classification);
    const riskColor = getRiskColor(scan.riskLevel);

    printWindow.document.write(`
      <html>
        <head>
          <title>OraLens AI Screening Report - ${scan.patientName}</title>
          <style>
            body { 
              font-family: 'Inter', system-ui, sans-serif; 
              color: #0f172a; 
              padding: 40px; 
              line-height: 1.6; 
              background-color: #ffffff;
            }
            .header-container {
              display: flex;
              justify-content: space-between;
              align-items: center;
              border-bottom: 2px solid #0EA5E9;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .brand {
              font-size: 28px;
              font-weight: 800;
              color: #0ea5e9;
              letter-spacing: -0.05em;
            }
            .brand span {
              color: #475569;
            }
            .report-title {
              font-size: 14px;
              font-weight: 700;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #64748b;
            }
            .grid {
              display: grid;
              grid-template-columns: 1.2fr 0.8fr;
              gap: 40px;
              margin-bottom: 35px;
            }
            .section-title {
              font-size: 13px;
              font-weight: 700;
              color: #0ea5e9;
              text-transform: uppercase;
              letter-spacing: 0.05em;
              border-bottom: 1px solid #e2e8f0;
              padding-bottom: 6px;
              margin-bottom: 16px;
              margin-top: 10px;
            }
            .info-row {
              display: flex;
              margin-bottom: 10px;
              font-size: 14px;
            }
            .info-label {
              font-weight: 600;
              width: 130px;
              color: #475569;
            }
            .info-val {
              color: #0f172a;
            }
            .image-box {
              text-align: center;
              background-color: #f8fafc;
              border: 1px solid #e2e8f0;
              border-radius: 16px;
              padding: 15px;
            }
            .image-box img {
              max-width: 100%;
              max-height: 240px;
              object-fit: contain;
              border-radius: 8px;
              border: 1px solid #cbd5e1;
            }
            .recommendation-card {
              background-color: #f0f9ff;
              border-left: 4px solid #0ea5e9;
              padding: 20px;
              border-radius: 8px;
              margin-bottom: 40px;
            }
            .recommendation-title {
              font-weight: 700;
              color: #0369a1;
              font-size: 14px;
              margin-bottom: 8px;
            }
            .recommendation-body {
              font-size: 14px;
              color: #0c4a6e;
              margin: 0;
              font-style: italic;
            }
            .footer-disclaimer {
              border-top: 1px solid #e2e8f0;
              padding-top: 20px;
              font-size: 11.5px;
              color: #dc2626;
              font-weight: 600;
              text-align: center;
              line-height: 1.5;
            }
            @media print {
              body { padding: 10px; }
            }
          </style>
        </head>
        <body>
          <div class="header-container">
            <div class="brand">OraLens<span>AI</span></div>
            <div class="report-title">Health Scan Report</div>
          </div>
          
          <div class="grid">
            <div>
              <div class="section-title">Your Profile Details</div>
              <div class="info-row"><span class="info-label">Name:</span><span class="info-val">${scan.patientName}</span></div>
              <div class="info-row"><span class="info-label">Age:</span><span class="info-val">${scan.patientAge}</span></div>
              <div class="info-row"><span class="info-label">Gender:</span><span class="info-val">${scan.patientGender}</span></div>
              <div class="info-row"><span class="info-label">Scan Date:</span><span class="info-val">${new Date(scan.timestamp).toLocaleString()}</span></div>
              
              <div class="section-title" style="margin-top: 30px;">AI Diagnostics</div>
              <div class="info-row">
                <span class="info-label">Classification:</span>
                <span class="info-val" style="font-weight: 700; color: ${badgeColor};">${scan.classification}</span>
              </div>
              <div class="info-row">
                <span class="info-label">Confidence:</span>
                <span class="info-val">${scan.confidence.toFixed(1)}%</span>
              </div>
              <div class="info-row">
                <span class="info-label">Risk Level:</span>
                <span class="info-val" style="font-weight: 700; color: ${riskColor};">${scan.riskLevel}</span>
              </div>
            </div>
            
            <div>
              <div class="section-title">Scan Photo</div>
              <div class="image-box">
                <img src="${scan.imageThumbnail}" alt="Scan Photo" />
              </div>
            </div>
          </div>

          <div>
            <div class="section-title">Reported Symptoms</div>
            <p style="font-size: 14px; color: #334155; margin-bottom: 30px; background-color: #f8fafc; padding: 12px 16px; border-radius: 8px; border: 1px solid #e2e8f0;">
              ${scan.clinicalNotes || 'No notes specified.'}
            </p>
          </div>

          <div class="recommendation-card">
            <div class="recommendation-title">AI Recommendation</div>
            <p class="recommendation-body">"${scan.recommendation}"</p>
          </div>

          <div class="footer-disclaimer">
            IMPORTANT WARNING: This screening report was generated by the OraLens AI deep-learning model for personal wellness support. It does NOT constitute a medical diagnosis. If you have a sore, spot, or patch in your mouth that does not heal within 14 days, please consult a dentist or qualified medical professional immediately for proper evaluation.
          </div>

          <script>
            window.onload = () => {
              window.print();
              setTimeout(() => window.close(), 1000);
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <section className="py-8 sm:py-12 bg-bg flex-grow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        
        {/* Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/50 pb-6 mb-8">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-white">My Health Logs</h1>
            <p className="text-sm text-muted mt-1">Review your past oral scans and checkup details</p>
          </div>
          {totalScans > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 self-start sm:self-center px-4 py-2 rounded-xl border border-cancer/30 bg-cancer/5 text-xs font-bold text-cancer hover:bg-cancer/15 transition-all cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Clear My Logs
            </button>
          )}
        </div>

        {/* Statistics Widgets */}
        <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-8">
          <div className="glass-panel rounded-2xl p-5 border border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">My Total Scans</p>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-3xl font-extrabold text-white">{totalScans}</span>
              <FolderHeart className="h-6 w-6 text-primary opacity-80" />
            </div>
          </div>
          
          <div className="glass-panel rounded-2xl p-5 border border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">High Risk Scans</p>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-3xl font-extrabold text-cancer">{highRiskCount}</span>
              <AlertTriangle className="h-6 w-6 text-cancer opacity-80" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">OPMD / Moderate</p>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-3xl font-extrabold text-opmd">{moderateRiskCount}</span>
              <TrendingUp className="h-6 w-6 text-opmd opacity-80" />
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-border">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Avg Scan Confidence</p>
            <div className="flex items-center justify-between mt-2.5">
              <span className="text-3xl font-extrabold text-healthy">
                {totalScans > 0 ? `${avgConfidence.toFixed(1)}%` : 'N/A'}
              </span>
              <Sparkles className="h-6 w-6 text-healthy opacity-80" />
            </div>
          </div>
        </div>

        {/* Filters and Search Bar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search past scans by name or result..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-xl border border-border bg-card/40 py-2.5 pl-10 pr-4 text-sm text-white placeholder-muted focus:border-primary focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-card/40 border border-border rounded-xl px-3 py-1.5 min-w-[200px]">
            <Filter className="h-4 w-4 text-muted shrink-0" />
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="w-full bg-transparent text-sm text-text focus:outline-none"
            >
              <option value="All">Filter by Risk (All)</option>
              <option value="Low">Low Risk (Healthy)</option>
              <option value="Moderate">Moderate Risk (OPMD)</option>
              <option value="High">High Risk (Cancer)</option>
              <option value="Uncertain — Refer to Specialist">Uncertain Risk</option>
            </select>
          </div>
        </div>

        {/* Scan Records Table */}
        <div className="glass-panel rounded-2xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-surface/65 text-xs font-bold uppercase tracking-wider text-muted">
                  <th className="px-6 py-4">Scan</th>
                  <th className="px-6 py-4">Profile Name</th>
                  <th className="px-6 py-4">AI Result</th>
                  <th className="px-6 py-4">Risk Level</th>
                  <th className="px-6 py-4">Date & Time</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted">
                      <div className="flex flex-col items-center justify-center gap-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent mx-auto" />
                        <span className="text-sm font-medium text-muted">Synchronizing cloud medical database...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredHistory.length > 0 ? (
                  filteredHistory.map((scan) => {
                    const badgeColor = getClassificationColor(scan.classification);
                    const riskColor = getRiskColor(scan.riskLevel);
                    return (
                      <tr key={scan.id} className="hover:bg-card/25 transition-colors">
                        <td className="px-6 py-3">
                          {scan.imageThumbnail ? (
                            <img
                              src={scan.imageThumbnail}
                              alt="Scan thumb"
                              className="h-10 w-10 rounded-lg object-cover border border-border/80"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded-lg bg-surface flex items-center justify-center border border-border">
                              <Eye className="h-4 w-4 text-muted" />
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-3">
                          <div className="font-semibold text-white">{scan.patientName}</div>
                          <div className="text-[11px] text-muted mt-0.5">
                            Age: {scan.patientAge} · Gender: {scan.patientGender}
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-1.5">
                            <span 
                              className="h-2 w-2 rounded-full shrink-0" 
                              style={{ backgroundColor: badgeColor }} 
                            />
                            <span className="font-medium text-white">{scan.classification}</span>
                            <span className="text-xs text-muted">({scan.confidence.toFixed(1)}%)</span>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                            style={{
                              backgroundColor: `${riskColor}15`,
                              color: riskColor,
                              border: `1px solid ${riskColor}30`,
                            }}
                          >
                            {scan.riskLevel}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-muted">
                          <div className="flex items-center gap-1.5 text-xs">
                            <Clock className="h-3.5 w-3.5" />
                            {new Date(scan.timestamp).toLocaleDateString()} at{' '}
                            {new Date(scan.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-right">
                          <div className="inline-flex gap-2">
                            <button
                              onClick={() => setSelectedScan(scan)}
                              className="p-1.5 rounded-lg border border-border bg-surface hover:border-primary hover:text-primary transition-colors cursor-pointer"
                              title="View report"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(scan.id)}
                              className="p-1.5 rounded-lg border border-border bg-surface hover:border-cancer hover:text-cancer transition-colors cursor-pointer"
                              title="Delete record"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-muted">
                      No scans found in your log journal.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Report Modal */}
        <AnimatePresence>
          {selectedScan && (
            <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6 sm:px-6">
              {/* Blur Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedScan(null)}
                className="absolute inset-0 bg-bg/85 backdrop-blur-sm"
              />

              {/* Modal Body */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 15 }}
                className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl border border-border bg-card p-6 shadow-2xl z-10"
              >
                {/* Close Button */}
                <button
                  onClick={() => setSelectedScan(null)}
                  className="absolute top-4 right-4 p-2 text-muted hover:text-white rounded-lg hover:bg-surface transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Modal Header */}
                <div className="border-b border-border pb-4 mb-6">
                  <h2 className="text-xl font-bold font-display text-white">Oral Screening Record</h2>
                  <p className="text-xs text-muted mt-1">Scan ID: {selectedScan.id}</p>
                </div>

                {/* Information Grid */}
                <div className="grid gap-6 md:grid-cols-2">
                  
                  {/* Left Column: Metadata */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted">Profile Details</h3>
                      <p className="text-base font-bold text-white mt-1">{selectedScan.patientName}</p>
                      <p className="text-xs text-muted mt-0.5">
                        Age: {selectedScan.patientAge} · Gender: {selectedScan.patientGender}
                      </p>
                    </div>

                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted">AI Output Results</h3>
                      <div className="mt-1 flex flex-wrap gap-2 items-center">
                        <span 
                          className="font-bold text-base"
                          style={{ color: getClassificationColor(selectedScan.classification) }}
                        >
                          {selectedScan.classification}
                        </span>
                        <span className="text-sm text-muted">({selectedScan.confidence.toFixed(1)}% Confidence)</span>
                      </div>
                      <div className="mt-2">
                        <span
                          className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
                          style={{
                            backgroundColor: `${getRiskColor(selectedScan.riskLevel)}15`,
                            color: getRiskColor(selectedScan.riskLevel),
                            border: `1px solid ${getRiskColor(selectedScan.riskLevel)}30`,
                          }}
                        >
                          Risk: {selectedScan.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Photo Thumbnail */}
                  <div className="flex flex-col items-center justify-center bg-[#0d1323] border border-border rounded-2xl p-4 aspect-video relative">
                    {selectedScan.imageThumbnail ? (
                      <img
                        src={selectedScan.imageThumbnail}
                        alt="Oral scan photo"
                        className="max-h-[140px] rounded-xl object-contain border border-border"
                      />
                    ) : (
                      <div className="text-xs text-muted">No Image Stored</div>
                    )}
                  </div>
                </div>

                {/* Patient Observations Notes */}
                {selectedScan.clinicalNotes && (
                  <div className="mt-6 bg-[#0b101f] border border-border/40 rounded-2xl p-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted mb-1">Reported Symptoms</h3>
                    <p className="text-xs text-text font-medium leading-relaxed">{selectedScan.clinicalNotes}</p>
                  </div>
                )}

                {/* Recommendations */}
                <div className="mt-6 bg-surface/50 border border-border rounded-2xl p-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-primary mb-1">AI Recommendation</h3>
                  <p className="text-xs text-muted leading-relaxed font-medium">{selectedScan.recommendation}</p>
                </div>

                {/* Bottom details and Print Action */}
                <div className="mt-8 border-t border-border pt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-[10px] text-muted">
                    Scanned on {new Date(selectedScan.timestamp).toLocaleString()} · Latency: {selectedScan.inferenceTimeMs || 'N/A'} ms
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handlePrintReport(selectedScan)}
                      className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-surface border border-border text-xs font-bold text-white hover:border-primary hover:text-primary transition-all cursor-pointer"
                    >
                      <Printer className="h-3.5 w-3.5" />
                      Save Report / Print
                    </button>
                    <button
                      onClick={() => setSelectedScan(null)}
                      className="px-4 py-2 rounded-xl bg-primary text-xs font-bold text-white hover:bg-primary/95 transition-all cursor-pointer"
                    >
                      Close Report
                    </button>
                  </div>
                </div>

              </motion.div>
            </div>
          )}
        </AnimatePresence>

      </div>
    </section>
  );
}
