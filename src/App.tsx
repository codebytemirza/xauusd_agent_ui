/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import React, { useState, useEffect } from "react";
import { Topbar } from "./components/Topbar";
import { ChartPanel } from "./components/ChartPanel";
import { AIPanel } from "./components/AIPanel";
import { TablePanel } from "./components/TablePanel";
import { PositionsPanel } from "./components/PositionsPanel";
import { ToastContainer } from "./components/Toast";
import { ToastProvider } from "./hooks/useToast";
import { useMarketData } from "./hooks/useMarketData";
import { useAnalysis } from "./hooks/useAnalysis";
import { API_BASE_URL } from "./lib/utils";
import { AnalysisResponse } from "./types";

function Dashboard() {
  const [symbol, setSymbol] = useState("XAUUSDm");
  const [timeframe, setTimeframe] = useState("H1");

  const { candles, isLoadingChart, fetchCandles } = useMarketData();
  const [activeTab, setActiveTab] = useState<"agent" | "positions">("agent");

  const [showMarkings, setShowMarkings] = useState(false);
  const [markingsData, setMarkingsData] = useState<AnalysisResponse | null>(
    null,
  );
  const [isLoadingMarkings, setIsLoadingMarkings] = useState(false);

  const {
    analysis,
    runAnalysis,
    isAnalyzing,
    signal,
    agentLogs,
    pendingActions,
    sendDecision,
  } = useAnalysis();

  const handleLoadChart = () => {
    fetchCandles(symbol, timeframe);
  };

  useEffect(() => {
    handleLoadChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [symbol, timeframe]);

  useEffect(() => {
    if (showMarkings && candles.length > 0) {
      const getMarkings = async () => {
        setIsLoadingMarkings(true);
        try {
          const res = await fetch(`${API_BASE_URL}/api/analysis/full`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ candles }),
          });
          if (res.ok) {
            const data = await res.json();
            setMarkingsData(data);
          }
        } catch (e) {
          console.error(e);
        } finally {
          setIsLoadingMarkings(false);
        }
      };
      getMarkings();
    } else {
      setMarkingsData(null);
    }
  }, [showMarkings, candles]);

  const handleRunAnalysis = () => {
    if (candles.length > 0) {
      runAnalysis(symbol, timeframe, candles);
    }
  };

  const displayedAnalysis = showMarkings ? markingsData : analysis;

  return (
    <div className="flex flex-col h-screen w-full bg-gray-950 text-gray-100 font-sans overflow-hidden select-none">
      <Topbar
        symbol={symbol}
        setSymbol={setSymbol}
        timeframe={timeframe}
        setTimeframe={setTimeframe}
        onLoadChart={handleLoadChart}
        onRunAnalysis={handleRunAnalysis}
        isLoadingChart={isLoadingChart}
        isAnalyzing={isAnalyzing}
        candlesLoaded={candles.length > 0}
        showMarkings={showMarkings}
        setShowMarkings={setShowMarkings}
        isLoadingMarkings={isLoadingMarkings}
      />

      <div className="flex-1 overflow-y-auto lg:overflow-hidden flex flex-col">
        <main className="flex flex-col lg:flex-row flex-1 min-h-0 shrink-0 lg:shrink">
          <section className="w-full lg:w-[60%] h-[400px] lg:h-auto border-b lg:border-b-0 lg:border-r border-gray-800 relative bg-gray-950 flex flex-col shrink-0">
            <ChartPanel candles={candles} analysis={displayedAnalysis} />
          </section>
          <section className="w-full lg:w-[40%] h-[350px] lg:h-auto bg-gray-900 flex flex-col shrink-0 overflow-hidden">
            <div className="flex border-b border-gray-800 bg-gray-950 shrink-0">
              <button
                onClick={() => setActiveTab("agent")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === "agent" ? "text-blue-400 border-b-2 border-blue-400 bg-gray-900" : "text-gray-500 hover:text-gray-300"}`}
              >
                📡 AI AGENT
              </button>
              <button
                onClick={() => setActiveTab("positions")}
                className={`flex-1 py-3 text-xs font-bold uppercase tracking-widest transition-colors ${activeTab === "positions" ? "text-blue-400 border-b-2 border-blue-400 bg-gray-900" : "text-gray-500 hover:text-gray-300"}`}
              >
                📊 POSITIONS
              </button>
            </div>

            <div className="flex-1 overflow-hidden flex flex-col">
              {activeTab === "agent" ? (
                <AIPanel
                  isAnalyzing={isAnalyzing}
                  signal={signal}
                  agentLogs={agentLogs}
                  pendingActions={pendingActions}
                  onDecision={sendDecision}
                />
              ) : (
                <PositionsPanel agentLogs={agentLogs} symbol={symbol} />
              )}
            </div>
          </section>
        </main>

        <footer className="h-[400px] lg:h-[220px] bg-gray-950 border-t border-gray-800 flex flex-col shrink-0">
          <TablePanel
            analysis={displayedAnalysis}
            candlesLoaded={candles.length > 0}
            candleCount={candles.length}
          />
        </footer>
      </div>

      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <Dashboard />
    </ToastProvider>
  );
}
