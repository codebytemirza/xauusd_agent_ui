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
  { id: 'swings',    label: 'Swings' },
  { id: 'bos',       label: 'BOS / CHoCH' },
  { id: 'pois',      label: 'POIs' },
];

const fmtTime = (t?: string) =>
  t ? format(new Date(t), "yyyy-MM-dd HH:mm") : '—';

const fmtPrice = (n?: number) =>
  n != null ? n.toFixed(2) : '—';

export function TablePanel({ analysis, candlesLoaded, candleCount }: TablePanelProps) {
  const [activeTab, setActiveTab] = useState('swings');

  if (!candlesLoaded) {
    return <div className="p-8 text-center text-gray-500 bg-gray-950 uppercase font-bold text-xs tracking-wider">Load chart to see data tables</div>;
  }

  if (!analysis) {
    return <div className="p-8 text-center text-gray-500 bg-gray-950 uppercase font-bold text-xs tracking-wider">Run AI Analysis to populate tables</div>;
  }

  const { summary } = analysis;
  const activePois = analysis.pois.filter(p => p.status === 'active');

  return (
    <>
      <nav className="flex border-b border-gray-800 bg-gray-900 shrink-0 overflow-x-auto hide-scrollbar">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-6 py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-colors whitespace-nowrap",
              activeTab === tab.id
                ? "border-amber-500 bg-gray-800 text-gray-100"
                : "border-transparent text-gray-500 hover:text-gray-300"
            )}
          >
            {tab.label}
          </button>
        ))}

        <div className="flex-1 flex items-center justify-end px-6 space-x-3">
          <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest hidden sm:block">
            {candleCount} Candles &nbsp;|&nbsp;
            {summary.swing_highs + summary.swing_lows} Swings &nbsp;|&nbsp;
            {summary.breakouts} BOS &nbsp;|&nbsp;
            {activePois.length} Active POIs
          </div>
          <div className="flex space-x-1">
            {Object.entries(summary.pois_by_type).map(([type, count]) => {
              if (count === 0) return null;
              const isBullish = type.startsWith('bullish');
              const shortLabel = type.replace('bullish_', '').replace('bearish_', '').toUpperCase();
              return (
                <div key={type} className={cn(
                  "px-1.5 h-4 rounded-sm border flex items-center justify-center font-bold text-[8px] uppercase",
                  isBullish ? "bg-green-900/50 border-green-500/50 text-green-400" : "bg-red-900/50 border-red-500/50 text-red-400"
                )}>
                  {shortLabel}: {count}
                </div>
              );
            })}
          </div>
        </div>
      </nav>

      <div className="flex-1 overflow-auto">
        <table className="w-full text-left border-collapse font-mono text-[11px] whitespace-nowrap min-w-[600px]">

          {/* ── Swings ── */}
          {activeTab === 'swings' && (
            <>
              <thead className="sticky top-0 bg-gray-950 text-gray-500 border-b border-gray-800 uppercase tracking-tighter shadow-sm z-10">
                <tr>
                  <th className="px-6 py-2 font-semibold">Type</th>
                  <th className="px-6 py-2 font-semibold">Level</th>
                  <th className="px-6 py-2 font-semibold">Time (UTC)</th>
                  <th className="px-6 py-2 font-semibold">Index</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/50">
                {[
                  ...analysis.swing_highs.map(s => ({ ...s, _type: 'SWING HIGH' })),
                  ...analysis.swing_lows.map(s => ({ ...s, _type: 'SWING LOW' })),
                ]
                  .sort((a, b) => b.index - a.index)
                  .map((row, i) => (
                    <tr key={i} className="bg-gray-900/30 hover:bg-gray-800/50 transition-colors">
                      <td className={cn("px-6 py-2 font-bold", row._type === 'SWING HIGH' ? "text-amber-400" : "text-blue-400")}>
                        {row._type}
                      </td>
                      <td className="px-6 py-2">{fmtPrice(row.price)}</td>
                      <td className="px-6 py-2 text-gray-400">{fmtTime(row.time)}</td>
                      <td className="px-6 py-2 text-gray-500">{row.index}</td>
                    </tr>
                  ))}
              </tbody>
            </>
          )}

          {/* ── BOS / CHoCH ── */}
          {activeTab === 'bos' && (
            <>
              <thead className="sticky top-0 bg-gray-950 text-gray-500 border-b border-gray-800 uppercase tracking-tighter shadow-sm z-10">
                <tr>
                  <th className="px-6 py-2 font-semibold">Direction</th>
                  <th className="px-6 py-2 font-semibold">Swing Level</th>
                  <th className="px-6 py-2 font-semibold">Break Close</th>
                  <th className="px-6 py-2 font-semibold">Break Time (UTC)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-900/50">
                {analysis.breakouts.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-6 text-center text-gray-600 text-xs uppercase">No BOS / CHoCH detected</td>
                  </tr>
                )}
                {analysis.breakouts.map((row, i) => {
                  const isBullish = row.type === 'bullish_break';
                  return (
                    <tr key={i} className="bg-gray-900/30 hover:bg-gray-800/50 transition-colors">
                      <td className={cn("px-6 py-2 font-bold uppercase", isBullish ? "text-indigo-400" : "text-pink-500")}>
                        {isBullish ? '▲ Bullish' : '▼ Bearish'} BOS
                      </td>
                      <td className="px-6 py-2">{fmtPrice(row.swing_price)}</td>
                      <td className="px-6 py-2">{fmtPrice(row.break_close)}</td>
                      <td className="px-6 py-2 text-gray-400">{fmtTime(row.break_time)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </>
          )}

          {/* ── POIs ── */}
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
                {analysis.pois
                  .slice()
                  .sort((a, b) => {
                    // active first
                    if (a.status === 'active' && b.status !== 'active') return -1;
                    if (b.status === 'active' && a.status !== 'active') return 1;
                    return 0;
                  })
                  .map((row, i) => {
                    const isBullish = row.type.startsWith('bullish');
                    const typeLabel = row.type
                      .replace('bullish_', '')
                      .replace('bearish_', '')
                      .replace('2cb', '2C Block')
                      .replace('fvg', 'FVG')
                      .replace('ob', 'OB')
                      .toUpperCase();

                    const statusColor =
                      row.status === 'active'
                        ? 'bg-green-500'
                        : row.status === 'partially_mitigated'
                        ? 'bg-amber-500'
                        : 'bg-gray-500';

                    return (
                      <tr key={i} className={cn(
                        "bg-gray-900/30 hover:bg-gray-800/50 transition-colors",
                        isBullish ? "border-l-2 border-green-500/50" : "border-l-2 border-red-500/50"
                      )}>
                        <td className={cn("px-6 py-2 font-bold", isBullish ? "text-green-400" : "text-red-400")}>
                          {isBullish ? '▲' : '▼'} {typeLabel}
                        </td>
                        <td className="px-6 py-2">{fmtPrice(row.zone_low)}</td>
                        <td className="px-6 py-2">{fmtPrice(row.zone_high)}</td>
                        <td className="px-6 py-2">
                          <div className="flex items-center space-x-2">
                            <span className={cn("w-1.5 h-1.5 rounded-full", statusColor)} />
                            <span className="text-gray-400 uppercase tracking-wider text-[9px] font-bold">
                              {row.status.replace(/_/g, ' ')}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-2 text-gray-500">{fmtTime(row.c1_time)}</td>
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
