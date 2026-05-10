import React from "react";
import { HealthBadge } from "./HealthBadge";
import { Loader2, Play } from "lucide-react";
import { cn } from "../lib/utils";
import { Candle } from "../types";

interface TopbarProps {
  symbol: string;
  setSymbol: (s: string) => void;
  timeframe: string;
  setTimeframe: (t: string) => void;
  onLoadChart: () => void;
  onRunAnalysis: () => void;
  isLoadingChart: boolean;
  isAnalyzing: boolean;
  candlesLoaded: boolean;
  showMarkings: boolean;
  setShowMarkings: (b: boolean) => void;
  isLoadingMarkings?: boolean;
}

const TIMEFRAMES = ["M1", "M5", "M15", "M30", "H1", "H4", "D1"];
const SYMBOLS = ["XAUUSDm", "XAUUSD", "EURUSD", "GBPUSD", "USDJPY"];

export function Topbar({
  symbol,
  setSymbol,
  timeframe,
  setTimeframe,
  onLoadChart,
  onRunAnalysis,
  isLoadingChart,
  isAnalyzing,
  candlesLoaded,
  showMarkings,
  setShowMarkings,
  isLoadingMarkings,
}: TopbarProps) {
  return (
    <header className="bg-gray-900 border-b border-gray-800 shrink-0 flex flex-col md:flex-row justify-between items-stretch md:items-center px-4 md:px-6 py-3 md:py-0 md:h-14 gap-4 md:gap-0 font-sans">
      <div className="flex items-center justify-between md:justify-start space-x-0 md:space-x-6 shrink-0 overflow-x-auto pb-1 md:pb-0 hide-scrollbar cursor-pointer md:cursor-auto">
        <div className="flex items-center space-x-2 shrink-0 pr-4 md:pr-0">
          <div className="w-8 h-8 bg-[#00ff9d] rounded flex items-center justify-center font-bold text-gray-950 text-xs shrink-0">
            7MS
          </div>
          <h1 className="text-base md:text-lg font-bold tracking-tight uppercase whitespace-nowrap text-[#e8edf5]">
            {symbol}
          </h1>
        </div>

        <div className="hidden md:block h-8 w-px bg-[#1a2540] shrink-0"></div>

        <div className="flex items-center space-x-2 md:space-x-4 shrink-0">
          <div className="flex items-center bg-[#0d1219] border border-[#1a2540] rounded px-2 md:px-3 py-1 text-sm font-medium shrink-0">
            <span className="text-[#4a5568] mr-2 hidden sm:inline uppercase text-[10px] tracking-widest">
              Symbol
            </span>
            <select
              value={symbol}
              onChange={(e) => setSymbol(e.target.value)}
              className="bg-transparent text-[#e8edf5] focus:outline-none cursor-pointer text-xs font-bold"
            >
              {SYMBOLS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          <div className="flex space-x-1 p-1 bg-[#0d1219] border border-[#1a2540] rounded shrink-0">
            {TIMEFRAMES.map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={cn(
                  "px-2 py-0.5 text-xs font-bold rounded transition-colors shrink-0",
                  timeframe === tf
                    ? "bg-[#00c6ff] text-gray-950"
                    : "text-[#4a5568] hover:bg-[#1a2540] hover:text-[#e8edf5]",
                )}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 md:space-x-4 shrink-0 overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
        <div className="flex items-center bg-[#0d1219] border border-[#1a2540] rounded-lg px-3 py-1.5 shrink-0 gap-3">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={showMarkings}
              onChange={(e) => setShowMarkings(e.target.checked)}
            />
            <div className="w-8 h-4 bg-[#1a2540] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-[#00c6ff]"></div>
            <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-[#e8edf5]">
              {isLoadingMarkings ? (
                <Loader2 className="w-3 h-3 animate-spin inline-block mr-1" />
              ) : null}{" "}
              Markings
            </span>
          </label>
        </div>

        <button
          onClick={onLoadChart}
          disabled={isLoadingChart}
          className="flex items-center justify-center gap-1.5 md:gap-2 bg-transparent hover:bg-white/5 border border-[#4a5568] text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-colors disabled:opacity-50 text-[#e8edf5] shrink-0 whitespace-nowrap flex-1 md:flex-none"
        >
          {isLoadingChart ? (
            <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
          ) : null}
          Load Base
        </button>

        <button
          onClick={onRunAnalysis}
          disabled={!candlesLoaded || isAnalyzing}
          className="flex items-center justify-center gap-1.5 md:gap-2 bg-[#00ff9d] hover:bg-[#00ff9d]/80 text-[#080c14] text-[10px] md:text-xs font-bold uppercase tracking-wider px-3 md:px-4 py-1.5 md:py-2 rounded-lg transition-all disabled:opacity-50 disabled:bg-[#1a2540] disabled:text-[#4a5568] shrink-0 whitespace-nowrap flex-1 md:flex-none border border-[#00ff9d]/50"
        >
          {isAnalyzing ? (
            <Loader2 className="w-3 h-3 md:w-4 md:h-4 animate-spin" />
          ) : null}
          Run AI Agent
        </button>

        <div className="hidden sm:block shrink-0">
          <HealthBadge />
        </div>
      </div>
    </header>
  );
}
