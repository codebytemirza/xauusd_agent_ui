import React, { useState } from 'react';
import { AnalysisResponse } from '../types';
import { cn } from '../lib/utils';
import { format } from 'date-fns';

interface TablePanelProps {
  analysis: AnalysisResponse | null;
  candlesLoaded: boolean;
  candleCount: number;
}

const TABS = [
  { id: 'swings', label: 'Swings' },
  { id: 'sweeps', label: 'Sweeps' },
  { id: 'breakouts', label: 'Breakouts' },
  { id: 'pois', label: 'POIs' }
];

export function TablePanel({ analysis, candlesLoaded, candleCount }: TablePanelProps) {
  const [activeTab, setActiveTab] = useState('swings');

  if (!candlesLoaded) {
     return <div className="p-8 text-center text-gray-500 bg-gray-950 uppercase font-bold text-xs tracking-wider">Load chart to see data tables</div>;
  }

  if (!analysis) {
     return <div className="p-8 text-center text-gray-500 bg-gray-950 uppercase font-bold text-xs tracking-wider">Run AI Analysis to populate tables</div>;
  }

  const { summary } = analysis;

  return (
    <>
      <nav className="flex border-b border-gray-800 bg-gray-900 shrink-0 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors",
              activeTab === tab.id 
                ? "border-amber-500 bg-gray-800 text-gray-100" 
                : "border-transparent text-gray-500 hover:text-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}

        <div className="flex-1 flex items-center justify-end px-6 space-x-4">
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest hidden sm:block">
            {candleCount} Candles | {summary.swing_highs + summary.swing_lows} Swings | {summary.sweeps} Sweeps | {summary.breakouts} Breakouts
          </div>
          <div className="flex space-x-1">
             {Object.entries(summary.pois_by_type).map(([type, count]) => {
                if (count === 0) return null;
                const isBullish = type.startsWith('bullish');
                return (
                  <div key={type} className={cn(
                    "px-1.5 h-4 rounded-sm border flex items-center justify-center font-bold text-[8px] uppercase",
                    isBullish ? "bg-green-900/50 border-green-500/50 text-green-400" : "bg-red-900/50 border-red-500/50 text-red-400"
                  )}>
                    {type.split('_')[1]}: {count}
                  </div>
                )
             })}
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse font-mono text-[11px] whitespace-nowrap min-w-[600px]">
          {activeTab === 'swings' && (
            <>
              <thead className="sticky top-0 bg-gray-950 text-gray-500 border-b border-gray-800 uppercase tracking-tighter shadow-sm z-10">
                <tr>
                  <th className="px-6 py-2 font-semibold">Type</th>
                  <th className="px-6 py-2 font-semibold">Price</th>
                  <th className="px-6 py-2 font-semibold">Time (UTC)</th>
                  <th className="px-6 py-2 font-semibold">Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/50">
                {[...analysis.swing_highs.map(s => ({...s, _type: 'SWING HIGH'})), ...analysis.swing_lows.map(s => ({...s, _type: 'SWING LOW'}))]
                  .sort((a,b) => new Date(b.time).getTime() - new Date(a.time).getTime())
                  .map((row, i) => (
                  <tr key={i} className="bg-gray-900/30 hover:bg-gray-800/50 transition-colors">
                    <td className={cn("px-6 py-2 font-bold", row._type === 'SWING HIGH' ? "text-amber-500" : "text-blue-400")}>{row._type}</td>
                    <td className="px-6 py-2">{row.price.toFixed(5)}</td>
                    <td className="px-6 py-2 text-gray-400">{format(new Date(row.time), "yyyy-MM-dd'T'HH:mm:ss'Z'")}</td>
                    <td className="px-6 py-2 text-gray-500">{row.index}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {activeTab === 'sweeps' && (
            <>
              <thead className="sticky top-0 bg-gray-950 text-gray-500 border-b border-gray-800 uppercase tracking-tighter shadow-sm z-10">
                <tr>
                  <th className="px-6 py-2 font-semibold">Direction</th>
                  <th className="px-6 py-2 font-semibold">Swept Price</th>
                  <th className="px-6 py-2 font-semibold">Candle Time</th>
                  <th className="px-6 py-2 font-semibold">Type</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/50">
                {analysis.sweeps.map((row, i) => (
                  <tr key={i} className="bg-gray-900/30 hover:bg-gray-800/50 transition-colors">
                    <td className={cn("px-6 py-2 font-bold uppercase", row.type.includes('bullish') || row.type.includes('low') ? "text-green-500" : "text-red-500")}>
                      {row.type.includes('low') ? 'bullish' : 'bearish'}
                    </td>
                    <td className="px-6 py-2">{(row.swept_price || row.swing_price || 0).toFixed(5)}</td>
                    <td className="px-6 py-2 text-gray-400">
                      {row.sweep_start_time || row.sweep_candle_time 
                        ? format(new Date(row.sweep_start_time || row.sweep_candle_time), "yyyy-MM-dd'T'HH:mm:ss'Z'") 
                        : '-'}
                    </td>
                    <td className="px-6 py-2 text-gray-400 font-medium uppercase">{row.type.replace('_',' ')}</td>
                  </tr>
                ))}
              </tbody>
            </>
          )}

          {activeTab === 'breakouts' && (
             <>
               <thead className="sticky top-0 bg-gray-950 text-gray-500 border-b border-gray-800 uppercase tracking-tighter shadow-sm z-10">
                 <tr>
                   <th className="px-6 py-2 font-semibold">Direction</th>
                   <th className="px-6 py-2 font-semibold">Break Price</th>
                   <th className="px-6 py-2 font-semibold">Candle Time</th>
                   <th className="px-6 py-2 font-semibold">Type</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-gray-900/50">
                 {analysis.breakouts.map((row, i) => (
                   <tr key={i} className="bg-gray-900/30 hover:bg-gray-800/50 transition-colors">
                     <td className={cn("px-6 py-2 font-bold uppercase", row.type.includes('bullish') || row.type.includes('low') ? "text-indigo-400" : "text-pink-500")}>
                       {row.type.includes('low') ? 'bullish' : 'bearish'}
                     </td>
                     <td className="px-6 py-2">{(row.break_price || row.break_close || row.swing_price || 0).toFixed(5)}</td>
                     <td className="px-6 py-2 text-gray-400">
                      {row.break_time || row.break_candle_time 
                        ? format(new Date(row.break_time || row.break_candle_time), "yyyy-MM-dd'T'HH:mm:ss'Z'") 
                        : '-'}
                    </td>
                     <td className="px-6 py-2 text-gray-400 font-medium uppercase">{row.type.replace('_',' ')}</td>
                   </tr>
                 ))}
               </tbody>
             </>
          )}

           {activeTab === 'pois' && (
              <>
                <thead className="sticky top-0 bg-gray-950 text-gray-500 border-b border-gray-800 uppercase tracking-tighter shadow-sm z-10">
                  <tr>
                    <th className="px-6 py-2 font-semibold">POI Type</th>
                    <th className="px-6 py-2 font-semibold">Zone Low</th>
                    <th className="px-6 py-2 font-semibold">Zone High</th>
                    <th className="px-6 py-2 font-semibold">Status</th>
                    <th className="px-6 py-2 font-semibold">C1 Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-900/50">
                  {analysis.pois.map((row, i) => {
                    const isBullish = row.type.startsWith('bullish');
                    const c1Time = row.c1_time || row.top_candle_time || row.bottom_candle_time || row.break_candle_time;
                    return (
                      <tr key={i} className={cn(
                        "bg-gray-900/30 hover:bg-gray-800/50 transition-colors",
                         isBullish ? "border-l-2 border-green-500/50" : "border-l-2 border-red-500/50"
                      )}>
                        <td className={cn("px-6 py-2 font-bold uppercase", isBullish ? "text-green-400" : "text-red-400")}>
                          {row.type.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-2">{(row.zone_low || 0).toFixed(5)}</td>
                        <td className="px-6 py-2">{(row.zone_high || 0).toFixed(5)}</td>
                        <td className="px-6 py-2">
                           <div className="flex items-center space-x-2">
                              <span className={cn(
                                "w-1.5 h-1.5 rounded-full",
                                (row.status || 'active') === 'active' ? "bg-green-500" :
                                (row.status || 'active') === 'partially_mitigated' ? "bg-amber-500" : "bg-gray-500"
                              )} />
                              <span className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">
                                {(row.status || 'active').replace('_', ' ')}
                              </span>
                           </div>
                        </td>
                        <td className="px-6 py-2 text-gray-500">{c1Time ? format(new Date(c1Time), "yyyy-MM-dd'T'HH:mm:ss'Z'") : '-'}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </>
           )}
        </table>
      </div>
    </>
  );
}
