
import React, { useState, useCallback, useEffect } from 'react';
import Header from './components/Header';
import BugInputForm from './components/BugInputForm';
import AnalysisResult from './components/AnalysisResult';
import HistorySidebar from './components/HistorySidebar';
import { analyzeBug } from './services/geminiService';
import { BugReport, PostMortemResult, AppStatus, HistoryItem } from './types';

const STORAGE_KEY = 'zenith_analysis_history';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [result, setResult] = useState<PostMortemResult | null>(null);
  const [activeReport, setActiveReport] = useState<BugReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);

  const [history, setHistory] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse history from storage", e);
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  }, [history]);

  const saveToHistory = useCallback((report: BugReport, result: PostMortemResult) => {
    const newItem: HistoryItem = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      report,
      result
    };
    setHistory(prev => [newItem, ...prev].slice(0, 50));
    setCurrentHistoryId(newItem.id);
  }, []);

  const deleteHistoryItem = useCallback((id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentHistoryId === id) {
      reset();
    }
  }, [currentHistoryId]);

  const clearHistory = useCallback(() => {
    if (window.confirm("Are you sure you want to clear all history?")) {
      setHistory([]);
      reset();
    }
  }, []);

  const handleAnalysis = useCallback(async (report: BugReport) => {
    setStatus(AppStatus.ANALYZING);
    setError(null);
    setResult(null);
    setActiveReport(report);

    try {
      const data = await analyzeBug(report);
      setResult(data);
      setStatus(AppStatus.COMPLETED);
      saveToHistory(report, data);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during analysis.');
      setStatus(AppStatus.ERROR);
    }
  }, [saveToHistory]);

  const handleSelectHistory = (item: HistoryItem) => {
    setResult(item.result);
    setActiveReport(item.report);
    setStatus(AppStatus.COMPLETED);
    setCurrentHistoryId(item.id);
  };

  const reset = () => {
    setStatus(AppStatus.IDLE);
    setResult(null);
    setActiveReport(null);
    setError(null);
    setCurrentHistoryId(null);
  };

  return (
    <div className="min-h-screen pb-20 selection:bg-zinc-500/20">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 pt-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          <div className="hidden lg:block lg:col-span-3 h-[calc(100vh-140px)] sticky top-28">
            <HistorySidebar 
              history={history} 
              onSelectItem={handleSelectHistory} 
              onNewChat={reset}
              currentId={currentHistoryId}
              onDeleteItem={deleteHistoryItem}
              onClearHistory={clearHistory}
            />
          </div>

          <div className={`${status === AppStatus.COMPLETED ? 'lg:col-span-9' : 'lg:col-span-9 max-w-4xl mx-auto'} transition-all duration-500 w-full`}>
            {status !== AppStatus.COMPLETED ? (
              <div className="space-y-10">
                <div className="space-y-3">
                  <h2 className="text-4xl font-bold text-zinc-100 tracking-tight">Audit Logic Gap</h2>
                  <p className="text-zinc-500 text-lg">
                    Perform high-fidelity autopsy on source files. 
                    Uncover cognitive assumptions and structural flaws.
                  </p>
                </div>

                <div className="glass-panel p-8 rounded-3xl border border-zinc-800/50 shadow-2xl">
                  <BugInputForm 
                    onSubmit={handleAnalysis} 
                    isLoading={status === AppStatus.ANALYZING} 
                  />
                </div>

                {error && (
                  <div className="p-4 bg-red-950/20 border border-red-500/20 rounded-2xl flex items-start space-x-3">
                    <div className="text-red-400 text-sm">
                      <p className="font-bold">Execution Halted</p>
                      <p className="opacity-80">{error}</p>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
                {/* Left: Metadata summary */}
                <div className="xl:col-span-4 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Input Context</h3>
                    <button onClick={reset} className="text-zinc-400 text-[10px] uppercase font-bold hover:text-white transition-colors">Restart</button>
                  </div>
                  <div className="glass-panel rounded-2xl p-6 space-y-4 border border-zinc-800">
                    <div>
                      <span className="text-zinc-600 block text-[10px] font-bold uppercase mb-2">Source Extract</span>
                      <pre className="bg-black/40 p-3 rounded-xl mono text-zinc-400 text-[11px] overflow-x-auto max-h-[200px] border border-zinc-900">
                        {activeReport?.code.slice(0, 300)}{activeReport?.code && activeReport.code.length > 300 ? '...' : ''}
                      </pre>
                    </div>
                    <div className="pt-2 border-t border-zinc-800/50">
                      <span className="text-zinc-600 block text-[10px] font-bold uppercase mb-2">Intent</span>
                      <p className="text-zinc-300 text-xs italic leading-relaxed">{activeReport?.expectedBehavior}</p>
                    </div>
                  </div>
                  
                  {/* Assumption Error Card */}
                  <div className="bg-zinc-100 p-6 rounded-2xl border border-zinc-200 shadow-xl">
                    <h4 className="text-zinc-900 text-xs font-bold uppercase tracking-widest mb-3">Root Cause</h4>
                    <p className="text-zinc-800 font-bold mb-1">{result?.assumptionError.title}</p>
                    <p className="text-zinc-600 text-xs leading-relaxed">{result?.assumptionError.description}</p>
                  </div>
                </div>

                {/* Right: Detailed Analysis */}
                <div className="xl:col-span-8">
                  {result && <AnalysisResult result={result} sourceCode={activeReport?.code || ''} />}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {status === AppStatus.ANALYZING && (
         <div className="fixed inset-0 z-50 bg-zinc-950/80 backdrop-blur-md flex items-center justify-center">
            <div className="text-center space-y-6">
                <div className="w-12 h-12 border-2 border-zinc-800 border-t-zinc-200 rounded-full animate-spin mx-auto"></div>
                <p className="text-zinc-400 font-mono text-[10px] tracking-[0.3em] uppercase animate-pulse">Running Structural Audit...</p>
            </div>
         </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 py-3 px-6 glass-panel border-t border-zinc-800/30 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-600">
          <div className="flex space-x-6">
            <span>Model: Gemini-3-Pro-Deep</span>
            <span className="hidden md:inline">Processing: Logic-Agnostic</span>
          </div>
          <div className="flex items-center">
            <span>{history.length} Analysis Archived</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
