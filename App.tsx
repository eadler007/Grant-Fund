
import React, { useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { ProjectAnalysis, Grant, ApplicationStatus } from './types';
import { analyzeProposal, discoverGrants } from './services/geminiService';
import { saveProjectToCloud, loadProjectFromCloud, getFirebaseStatus, resetPermissionFlag, checkCloudHealth } from './services/storageService';
import { SummaryBar } from './components/SummaryBar';
import { GrantCard } from './components/GrantCard';

const STORAGE_KEY = 'nfc_strategy_projects_v2';
const SESSION_KEY = 'nfc_active_session_id';

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectAnalysis[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [cityName, setCityName] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingStage, setLoadingStage] = useState('Checking Cloud Connection...');
  const [error, setError] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [statusInfo, setStatusInfo] = useState(getFirebaseStatus());
  const [isCheckingHealth, setIsCheckingHealth] = useState(true);
  
  const justCreatedRef = useRef<string | null>(null);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || null
  , [projects, activeProjectId]);

  const refreshStatus = useCallback(async () => {
    setStatusInfo(getFirebaseStatus());
  }, []);

  useEffect(() => {
    const probe = async () => {
      setIsCheckingHealth(true);
      await checkCloudHealth();
      refreshStatus();
      setIsCheckingHealth(false);
    };
    probe();
    const interval = setInterval(probe, 20000); 
    return () => clearInterval(interval);
  }, [refreshStatus]);

  const forceSync = async (projectToSync?: ProjectAnalysis) => {
    const target = projectToSync || activeProject;
    if (!target) return false;
    setIsSyncing(true);
    const success = await saveProjectToCloud(target);
    refreshStatus();
    setIsSyncing(false);
    return success;
  };

  const initApp = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const hash = window.location.hash.replace('#', '');
      const params = new URLSearchParams(hash);
      const urlId = params.get('id');
      
      const localData = localStorage.getItem(STORAGE_KEY);
      const localProjects: ProjectAnalysis[] = localData ? JSON.parse(localData) : [];
      setProjects(localProjects);

      if (urlId) {
        setLoadingStage('Locating Workspace...');
        const existingLocal = localProjects.find(p => p.id === urlId);
        
        if (existingLocal) {
          setActiveProjectId(urlId);
          setLoading(false); 
        }

        const cloudData = await loadProjectFromCloud(urlId);
        if (cloudData) {
          setProjects(prev => {
            const others = prev.filter(p => p.id !== cloudData.id);
            return [cloudData, ...others];
          });
          setActiveProjectId(urlId);
          setError(null);
        } else if (!existingLocal && justCreatedRef.current !== urlId) {
          setError(`Workspace "${urlId}" exists in local cache but not in the new database. Tap "Push to Cloud" to initialize it.`);
        }
      } else {
        const sessionID = localStorage.getItem(SESSION_KEY);
        if (sessionID) setActiveProjectId(sessionID);
      }
    } catch (err) {
      setError("Sync handshake error.");
    } finally {
      setLoading(false);
      refreshStatus();
    }
  }, [refreshStatus]);

  useEffect(() => {
    initApp();
  }, [initApp]);

  useEffect(() => {
    if (activeProject) {
      localStorage.setItem(SESSION_KEY, activeProject.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
      
      const targetHash = `#id=${activeProject.id}`;
      if (window.location.hash !== targetHash) {
        window.history.replaceState(null, "", targetHash);
      }
    }
  }, [activeProject, projects]);

  const handleManualReset = () => {
    resetPermissionFlag();
    window.location.reload();
  };

  const handlePublish = async () => {
    if (!activeProject) return;
    setLoadingStage('Uploading to Cloud...');
    setLoading(true);
    const success = await forceSync();
    if (success) {
      setError(null);
      alert(`Success! Workspace "${activeProject.cityName}" is now live on the new database.`);
    } else {
      alert("Push Failed. Check if Firestore rules are set to: allow read, write: if true;");
    }
    setLoading(false);
  };

  const handleCreateNewProject = async () => {
    const trimmedCity = cityName.trim();
    if (!trimmedCity) return setError("Enter City Name");
    
    setLoading(true);
    setError(null);
    try {
      setLoadingStage('Generating Strategy...');
      const details = await analyzeProposal(trimmedCity, "NFC Public Infrastructure Framework");
      const grants = await discoverGrants(trimmedCity, details);
      
      const slug = trimmedCity.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newId = `${slug}-${Math.random().toString(36).substring(2, 7)}`;
      
      const newProject: ProjectAnalysis = {
        id: newId,
        cityName: trimmedCity,
        priorities: details.priorities || [],
        scale: details.scale || 'Citywide',
        equityGoals: details.equityGoals || '',
        budgetEstimate: Number(details.budgetEstimate) || 250000,
        fundingSecured: Number(details.fundingSecured) || 0,
        potentialGrants: grants || [],
        lastUpdated: Date.now(),
        isProcessed: true
      };

      setProjects(prev => [newProject, ...prev]);
      justCreatedRef.current = newId;

      setLoadingStage('Syncing Cloud Instance...');
      await saveProjectToCloud(newProject);
      
      setActiveProjectId(newId);
      setLoading(false);
      refreshStatus();
    } catch (err: any) {
      setError('Analysis timed out. Please retry.');
      setLoading(false);
    }
  };

  const updateGrant = (grantId: string, updates: Partial<Grant>) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? {
      ...p,
      lastUpdated: Date.now(),
      potentialGrants: p.potentialGrants.map(g => g.id === grantId ? { ...g, ...updates } : g)
    } : p));
  };

  const updateProjectField = (updates: Partial<ProjectAnalysis>) => {
    setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, ...updates, lastUpdated: Date.now() } : p));
  };

  const totals = useMemo(() => {
    if (!activeProject) return { potential: 0, securedFromGrants: 0 };
    return activeProject.potentialGrants.reduce((acc, curr) => {
      acc.potential += Number(curr.maxVal) || 0;
      if (curr.status === ApplicationStatus.AWARDED) {
        acc.securedFromGrants += Number(curr.confirmedAwardAmount || curr.maxVal) || 0;
      }
      return acc;
    }, { potential: 0, securedFromGrants: 0 });
  }, [activeProject]);

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      {statusInfo.isPermissionDenied && (
        <div className="bg-[#ed1c24] text-white py-3 px-6 text-center text-[10px] font-black uppercase tracking-widest sticky top-0 z-[100] shadow-2xl flex items-center justify-center gap-4">
          <span>⚠️ DB ACCESS DENIED: CHECK RULES</span>
          <button onClick={handleManualReset} className="bg-white/20 hover:bg-white/30 px-3 py-1 rounded-full border border-white/30 transition-all">
            Retry
          </button>
        </div>
      )}

      <header className="bg-[#0F172A] text-white pt-12 pb-40 px-6 relative">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-start gap-8 z-10 relative">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-black tracking-tight">NFC Strategy Cloud</h1>
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${statusInfo.isConnected ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-amber-500/10 border-amber-500/30'}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                <span className={`text-[9px] font-black uppercase tracking-tighter ${statusInfo.isConnected ? 'text-emerald-500' : 'text-amber-500'}`}>
                  {isCheckingHealth ? 'Syncing...' : statusInfo.isConnected ? 'Live Link' : 'Local Only'}
                </span>
              </div>
            </div>
          </div>
          
          <div className="flex gap-4 items-center">
            {projects.length > 0 && (
              <select 
                value={activeProjectId || ''} 
                onChange={e => setActiveProjectId(e.target.value || null)}
                className="bg-slate-800 border-none rounded-xl px-4 py-3 text-xs font-black uppercase tracking-widest outline-none ring-1 ring-white/10 text-white cursor-pointer"
              >
                <option value="">Select Workspace</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.cityName}</option>)}
              </select>
            )}
            <button onClick={() => {
              setActiveProjectId(null);
              window.history.replaceState(null, "", window.location.pathname);
              setError(null);
            }} className="bg-[#00aeef] p-3 rounded-xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-transform">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4"></path></svg>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 relative z-20 -mt-20">
        {loading && (
          <div className="bg-white rounded-[40px] p-20 shadow-2xl text-center border border-slate-100 flex flex-col items-center">
            <div className="w-16 h-16 border-4 border-[#00aeef] border-t-transparent rounded-full animate-spin mb-8"></div>
            <p className="font-black text-slate-900 uppercase tracking-widest text-lg">{loadingStage}</p>
          </div>
        )}

        {!activeProject && !loading && (
          <div className="max-w-2xl mx-auto bg-white rounded-[40px] shadow-2xl p-12 border border-slate-100 text-center">
            <h2 className="text-2xl font-black text-slate-900 mb-2">New Strategy</h2>
            <p className="text-slate-400 text-xs font-bold mb-8 uppercase tracking-tight">Enter a city to generate a real-time funding landscape</p>
            <div className="space-y-4">
              <input 
                type="text" placeholder="City Name"
                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-5 text-slate-900 font-bold outline-none focus:border-[#00aeef] transition-all text-center text-lg shadow-inner"
                value={cityName} onChange={e => setCityName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleCreateNewProject()}
              />
              <button 
                onClick={handleCreateNewProject}
                className="w-full bg-[#00aeef] py-6 rounded-2xl font-black text-white uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-transform text-sm"
              >
                Map Opportunities
              </button>
            </div>
            {error && (
              <div className="mt-8 p-6 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 font-bold text-xs uppercase tracking-tight">
                {error}
              </div>
            )}
          </div>
        )}

        {activeProject && !loading && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <SummaryBar 
              totalPotential={totals.potential} 
              estimatedNeed={activeProject.budgetEstimate}
              secured={(activeProject.fundingSecured || 0) + totals.securedFromGrants}
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
              <div className="lg:col-span-1">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-200 sticky top-8">
                  <div className="mb-8 text-center">
                    <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block tracking-widest text-left">City</label>
                    <input 
                      className="text-xl font-black text-slate-900 w-full bg-transparent border-none p-0 focus:ring-0 text-left"
                      value={activeProject.cityName}
                      onChange={e => updateProjectField({ cityName: e.target.value })}
                    />
                  </div>

                  <div className="space-y-3">
                    <button 
                      onClick={handlePublish}
                      className="w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm bg-emerald-500 text-white hover:bg-emerald-600 transition-all flex items-center justify-center gap-2"
                    >
                      Push to Cloud
                    </button>

                    <button 
                      onClick={() => {
                        const url = `${window.location.origin}${window.location.pathname}#id=${activeProject.id}`;
                        navigator.clipboard.writeText(url);
                        alert("Workspace URL Copied!");
                      }}
                      className="w-full py-4 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-xl bg-[#0F172A] text-white hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
                    >
                      Copy Share Link
                    </button>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-3">
                {error && (
                  <div className="mb-6 p-6 bg-rose-50 border border-rose-100 rounded-[32px] flex justify-between items-center">
                    <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest max-w-[70%]">{error}</p>
                    <button onClick={handlePublish} className="bg-rose-600 text-white px-4 py-2 rounded-xl text-[9px] font-black uppercase">Push Now</button>
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {activeProject.potentialGrants.map(grant => (
                    <GrantCard 
                      key={grant.id} 
                      grant={grant} 
                      onUpdateStatus={(id, status) => updateGrant(id, { status })} 
                      onUpdateGrant={updateGrant}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
