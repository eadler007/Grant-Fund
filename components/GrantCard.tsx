
import React, { useState } from 'react';
import { Grant, FundingLevel, ApplicationStatus } from '../types';

interface GrantCardProps {
  grant: Grant;
  onUpdateStatus: (id: string, status: ApplicationStatus) => void;
  onUpdateGrant: (id: string, updates: Partial<Grant>) => void;
  onDeleteGrant?: (id: string) => void;
}

export const GrantCard: React.FC<GrantCardProps> = ({ grant, onUpdateStatus, onUpdateGrant, onDeleteGrant }) => {
  const [showNarrative, setShowNarrative] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValues, setEditValues] = useState({ ...grant });

  const levelColors = {
    [FundingLevel.LOCAL]: 'bg-slate-100 text-slate-700',
    [FundingLevel.STATE]: 'bg-[#00aeef]/10 text-[#00aeef]',
    [FundingLevel.FEDERAL]: 'bg-[#0F172A] text-white',
    [FundingLevel.PRIVATE]: 'bg-purple-100 text-purple-700',
  };

  const statusColors = {
    [ApplicationStatus.NOT_STARTED]: 'bg-slate-100 text-slate-600',
    [ApplicationStatus.IN_PROGRESS]: 'bg-amber-100 text-amber-700',
    [ApplicationStatus.SUBMITTED]: 'bg-[#00aeef]/10 text-[#00aeef]',
    [ApplicationStatus.AWARDED]: 'bg-emerald-100 text-emerald-700',
    [ApplicationStatus.DENIED]: 'bg-rose-100 text-rose-700',
  };

  const handleSave = () => {
    onUpdateGrant(grant.id, {
        ...editValues,
        minVal: Number(editValues.minVal),
        maxVal: Number(editValues.maxVal),
        confirmedAwardAmount: editValues.confirmedAwardAmount ? Number(editValues.confirmedAwardAmount) : undefined
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white border-2 border-[#00aeef] rounded-[40px] overflow-hidden shadow-2xl p-8 animate-in fade-in zoom-in duration-200 col-span-1 md:col-span-2 lg:col-span-1">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xs font-black uppercase text-[#00aeef] tracking-widest">Edit Matrix Item</h3>
            {onDeleteGrant && (
                <button onClick={() => onDeleteGrant(grant.id)} className="text-[10px] text-rose-500 font-black uppercase hover:underline">Delete</button>
            )}
        </div>
        <div className="space-y-4 max-h-[75vh] overflow-y-auto pr-2 custom-scrollbar pb-4">
          <div>
            <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Grant / Fund Name</label>
            <input className="w-full border-slate-100 border-2 rounded-2xl p-4 text-sm font-bold bg-slate-50 outline-none focus:border-[#00aeef] transition-colors" value={editValues.name} onChange={e => setEditValues({...editValues, name: e.target.value})} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Fund Type</label>
              <select className="w-full border-slate-100 border-2 rounded-2xl p-4 text-xs font-bold bg-slate-50 outline-none focus:border-[#00aeef]" value={editValues.level} onChange={e => setEditValues({...editValues, level: e.target.value as FundingLevel})}>
                {Object.values(FundingLevel).map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Avg Award Range</label>
              <input className="w-full border-slate-100 border-2 rounded-2xl p-4 text-xs font-bold bg-slate-50 outline-none focus:border-[#00aeef]" value={editValues.awardRange} onChange={e => setEditValues({...editValues, awardRange: e.target.value})} placeholder="e.g. $250k - $1M" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Estimated Max Value ($)</label>
                <input type="number" className="w-full border-slate-100 border-2 rounded-2xl p-4 text-xs font-bold bg-slate-50 outline-none focus:border-[#00aeef]" value={editValues.maxVal} onChange={e => setEditValues({...editValues, maxVal: Number(e.target.value)})} />
             </div>
             <div>
                <label className="text-[8px] font-black uppercase text-emerald-600 mb-1 block ml-2 tracking-widest">Confirmed Award ($)</label>
                <input type="number" className="w-full border-emerald-100 border-2 rounded-2xl p-4 text-xs font-black bg-emerald-50 text-emerald-700 outline-none focus:border-emerald-400" value={editValues.confirmedAwardAmount || ''} onChange={e => setEditValues({...editValues, confirmedAwardAmount: e.target.value ? Number(e.target.value) : undefined})} placeholder="Award Amount" />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
                <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Cycle Opens & Deadline</label>
                <input className="w-full border-slate-100 border-2 rounded-2xl p-4 text-xs font-bold bg-slate-50 outline-none focus:border-[#00aeef]" value={editValues.applicationPeriod} onChange={e => setEditValues({...editValues, applicationPeriod: e.target.value})} placeholder="e.g. Opens 01/01 - Due 03/15" />
             </div>
             <div>
                <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Award Date</label>
                <input className="w-full border-slate-100 border-2 rounded-2xl p-4 text-xs font-bold bg-slate-50 outline-none focus:border-[#00aeef]" value={editValues.awardDate || ''} onChange={e => setEditValues({...editValues, awardDate: e.target.value})} placeholder="e.g. Sept 2025" />
             </div>
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Recommended Use</label>
            <input className="w-full border-slate-100 border-2 rounded-2xl p-4 text-xs font-bold bg-slate-50 outline-none focus:border-[#00aeef]" value={editValues.recommendedUse} onChange={e => setEditValues({...editValues, recommendedUse: e.target.value})} placeholder="e.g. Fitness Court + Site Work" />
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Examples of Like Projects</label>
            <textarea className="w-full border-slate-100 border-2 rounded-2xl p-4 text-xs font-bold bg-slate-50 outline-none focus:border-[#00aeef]" value={editValues.projectExamples || ''} onChange={e => setEditValues({...editValues, projectExamples: e.target.value})} rows={2} placeholder="Mention Beltline projects, etc." />
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Match Requirements</label>
            <input className="w-full border-slate-100 border-2 rounded-2xl p-4 text-xs font-bold bg-slate-50 outline-none focus:border-[#00aeef]" value={editValues.matchRequired || ''} onChange={e => setEditValues({...editValues, matchRequired: e.target.value})} placeholder="e.g. 1:1 local match" />
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Website Link / URL</label>
            <input className="w-full border-slate-100 border-2 rounded-2xl p-4 text-xs font-bold bg-slate-50 outline-none focus:border-[#00aeef]" value={editValues.sourceLink} onChange={e => setEditValues({...editValues, sourceLink: e.target.value})} placeholder="https://..." />
          </div>

          <div>
            <label className="text-[8px] font-black uppercase text-slate-400 mb-1 block ml-2 tracking-widest">Notes & Eligibility</label>
            <textarea className="w-full border-slate-100 border-2 rounded-2xl p-4 text-xs font-bold bg-slate-50 outline-none focus:border-[#00aeef]" value={editValues.eligibility} onChange={e => setEditValues({...editValues, eligibility: e.target.value})} rows={3} />
          </div>

          <div className="flex gap-4 pt-4 sticky bottom-0 bg-white pb-2 z-10 border-t border-slate-100">
            <button onClick={handleSave} className="flex-1 bg-[#00aeef] text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-transform">Save Matrix Item</button>
            <button onClick={() => setIsEditing(false)} className="flex-1 bg-slate-100 text-slate-500 py-4 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-95 transition-transform">Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-100 rounded-[40px] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 group relative flex flex-col h-full">
      <div className="p-8 flex-1">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-3">
              <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full ${levelColors[grant.level]}`}>
                {grant.level}
              </span>
              <button onClick={() => setIsEditing(true)} className="opacity-0 group-hover:opacity-100 text-[9px] text-[#00aeef] font-black uppercase transition-opacity flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path></svg>
                Edit
              </button>
            </div>
            <h3 className="text-xl font-black text-slate-900 leading-tight group-hover:text-[#00aeef] transition-colors">{grant.name}</h3>
          </div>
          <div className="flex flex-col items-end gap-2">
            <select 
                value={grant.status}
                onChange={(e) => onUpdateStatus(grant.id, e.target.value as ApplicationStatus)}
                className={`text-[9px] font-black uppercase px-3 py-2 rounded-xl border-none cursor-pointer shadow-sm ${statusColors[grant.status]} outline-none ring-1 ring-black/5`}
            >
                {Object.values(ApplicationStatus).map(status => <option key={status} value={status}>{status}</option>)}
            </select>
            {grant.status === ApplicationStatus.AWARDED && !grant.confirmedAwardAmount && (
                <button onClick={() => setIsEditing(true)} className="text-[8px] font-black text-emerald-600 uppercase animate-pulse">Confirm Amount →</button>
            )}
          </div>
        </div>

        {grant.status === ApplicationStatus.AWARDED && grant.confirmedAwardAmount && (
            <div className="mb-6 bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex items-center justify-between shadow-inner">
                <div>
                    <p className="text-[8px] text-emerald-600 uppercase font-black mb-1 tracking-widest">Final Confirmed Award</p>
                    <p className="text-xl font-black text-emerald-700">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(grant.confirmedAwardAmount)}
                    </p>
                </div>
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                </div>
            </div>
        )}

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <p className="text-[8px] text-slate-400 uppercase font-black mb-1 tracking-widest">Avg Award Range</p>
            <p className="text-[11px] font-black text-slate-900 leading-tight">{grant.awardRange}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <p className="text-[8px] text-slate-400 uppercase font-black mb-1 tracking-widest">Cycle Opens & Deadline</p>
            <p className="text-[11px] font-black text-slate-900 leading-tight">{grant.applicationPeriod}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <p className="text-[8px] text-slate-400 uppercase font-black mb-1 tracking-widest">Award Date</p>
            <p className="text-[11px] font-black text-slate-900 leading-tight">{grant.awardDate || 'TBD'}</p>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100/50">
            <p className="text-[8px] text-slate-400 uppercase font-black mb-1 tracking-widest">Recommended Use</p>
            <p className="text-[11px] font-black text-slate-900 leading-tight">{grant.recommendedUse}</p>
          </div>
        </div>

        {grant.projectExamples && (
          <div className="mb-6">
            <p className="text-[8px] text-slate-400 uppercase font-black mb-2 tracking-widest">Other Like Projects</p>
            <div className="bg-indigo-50/30 p-4 rounded-2xl border border-indigo-100/20">
              <p className="text-[10px] text-indigo-900/70 font-bold leading-relaxed">{grant.projectExamples}</p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <p className="text-[8px] text-slate-400 uppercase font-black mb-2 tracking-widest">Notes & Eligibility</p>
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 overflow-hidden">
            <p className="text-[10px] text-slate-600 leading-relaxed font-bold">
              {grant.eligibility || 'Details pending verification.'}
            </p>
            {grant.matchRequired && (
              <div className="mt-3 pt-3 border-t border-slate-200/50 flex items-center gap-2">
                <span className="text-[7px] font-black uppercase bg-slate-200 text-slate-600 px-2 py-0.5 rounded">Match Req</span>
                <span className="text-[9px] font-black text-slate-900">{grant.matchRequired}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-3 mt-auto">
          <button 
            onClick={() => setShowNarrative(!showNarrative)}
            className={`flex-1 py-3.5 px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all shadow-lg ${showNarrative ? 'bg-slate-900 text-white' : 'bg-[#00aeef] text-white hover:bg-[#009bd5] shadow-blue-500/10'}`}
          >
            {showNarrative ? 'Close Builder' : 'Build Narrative'}
          </button>
          <a 
            href={grant.sourceLink === '#' ? undefined : grant.sourceLink} 
            target="_blank" 
            rel="noopener noreferrer"
            className={`w-12 h-12 flex items-center justify-center rounded-2xl border border-slate-200 shadow-md transition-all ${grant.sourceLink === '#' || !grant.sourceLink ? 'bg-slate-50 text-slate-300 cursor-not-allowed opacity-50' : 'bg-white text-[#00aeef] hover:scale-105 active:scale-95'}`}
            title={grant.sourceLink}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
          </a>
        </div>

        {showNarrative && (
          <div className="mt-6 p-6 bg-[#00aeef]/5 rounded-3xl border border-[#00aeef]/10 animate-in slide-in-from-top-4">
            <div className="flex justify-between items-center mb-4">
              <p className="text-[8px] font-black text-[#00aeef] uppercase tracking-widest">Strategy Narrative Draft</p>
              <button onClick={() => {
                const text = `Alignment for ${grant.name}: ${grant.narrativeDraft}`;
                navigator.clipboard.writeText(text);
              }} className="text-[8px] font-black uppercase text-slate-400 hover:text-slate-600">Copy</button>
            </div>
            <textarea 
              className="w-full bg-white border border-[#00aeef]/20 rounded-2xl p-4 text-[11px] text-slate-700 leading-relaxed h-40 outline-none font-bold mb-4 shadow-inner resize-none focus:border-[#00aeef] transition-colors"
              value={grant.narrativeDraft || ''}
              onChange={(e) => onUpdateGrant(grant.id, { narrativeDraft: e.target.value })}
              placeholder="Draft your pitch here. Connect grant eligibility to your city's health and equity goals..."
            />
          </div>
        )}
      </div>
    </div>
  );
};
