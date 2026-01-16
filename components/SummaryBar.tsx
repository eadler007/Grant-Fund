
import React from 'react';

interface SummaryBarProps {
  totalPotential: number;
  estimatedNeed: number;
  secured: number;
}

export const SummaryBar: React.FC<SummaryBarProps> = ({ totalPotential, estimatedNeed, secured }) => {
  const gap = Math.max(0, estimatedNeed - secured);
  const progressPercent = Math.min(100, (secured / estimatedNeed) * 100);
  const potentialCoverage = Math.min(100, (totalPotential / estimatedNeed) * 100);

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
      <div className="bg-white p-6 rounded-[32px] shadow-lg border border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Potential</p>
        <p className="text-2xl font-black text-[#00aeef]">{formatter.format(totalPotential)}</p>
      </div>
      <div className="bg-white p-6 rounded-[32px] shadow-lg border border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Estimated Budget</p>
        <p className="text-2xl font-black text-slate-900">{formatter.format(estimatedNeed)}</p>
      </div>
      <div className="bg-white p-6 rounded-[32px] shadow-lg border border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Funding Secured</p>
        <p className="text-2xl font-black text-emerald-600">{formatter.format(secured)}</p>
      </div>
      <div className="bg-white p-6 rounded-[32px] shadow-lg border border-slate-100">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Funding Gap</p>
        <p className="text-2xl font-black text-[#ed1c24]">{formatter.format(gap)}</p>
      </div>
      
      <div className="md:col-span-4 bg-white p-8 rounded-[32px] shadow-lg border border-slate-100">
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-black text-slate-900 uppercase tracking-tight">Funding Progress Status</p>
          <p className="text-sm font-black text-[#00aeef]">{Math.round(progressPercent)}% Secured</p>
        </div>
        <div className="w-full h-5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-100">
          <div 
            className="absolute h-full bg-[#00aeef]/20 transition-all duration-1000 ease-out" 
            style={{ width: `${potentialCoverage}%` }}
          />
          <div 
            className="absolute h-full bg-[#00aeef] transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(0,174,239,0.5)]" 
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <div className="flex gap-6 mt-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
            <span className="w-3 h-3 bg-[#00aeef] rounded-full"></span> Secured
          </div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-wider">
            <span className="w-3 h-3 bg-[#00aeef]/30 rounded-full"></span> Potential (Identified)
          </div>
        </div>
      </div>
    </div>
  );
};
