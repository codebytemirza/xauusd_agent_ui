import React from "react";
import { AgentEvent } from "../hooks/useAnalysis";

export function PositionsPanel({
  agentLogs,
  symbol,
}: {
  agentLogs: AgentEvent[];
  symbol: string;
}) {
  const posLogs = agentLogs.filter(
    (e) => e.type === "tool_result" && e.tool === "get_open_positions",
  );
  const latestPosParams =
    posLogs.length > 0 ? posLogs[posLogs.length - 1].result : null;

  let positions: any[] = [];
  if (typeof latestPosParams === "string") {
    try {
      positions = JSON.parse(latestPosParams).positions || [];
    } catch (e) {}
  } else if (latestPosParams) {
    positions = latestPosParams.positions || [];
  }

  const totalProfit = positions.reduce((sum, p) => sum + (p.profit || 0), 0);

  return (
    <div className="p-4 md:p-6 overflow-y-auto w-full h-full bg-gray-900">
      <div className="font-sans text-[#e8edf5] text-lg font-bold mb-4">
        Open Positions — {symbol}
      </div>

      <div className="flex gap-4 mb-6">
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 flex-1">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
            Open Trades
          </div>
          <div className="text-2xl font-mono text-gray-200">
            {positions.length}
          </div>
        </div>
        <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 flex-1">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">
            Total P&L
          </div>
          <div
            className={`text-2xl font-mono ${totalProfit >= 0 ? "text-[#00ff9d]" : "text-[#ff3d5a]"}`}
          >
            ${totalProfit.toFixed(2)}
          </div>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="bg-[#0d1219] border border-dashed border-[#1a2540] rounded-xl p-12 text-center mt-6">
          <div className="text-4xl mb-3 opacity-30">📊</div>
          <div className="text-[#4a5568] font-mono text-sm tracking-wide">
            No open positions
          </div>
        </div>
      ) : (
        positions.map((pos, i) => {
          const isBuy = pos.type === 0 || pos.type === "BUY";
          const c = isBuy ? "#00ff9d" : "#ff3d5a";
          return (
            <div
              key={i}
              className="bg-[#0d1219] border border-[#1a2540] border-l-[3px] rounded-lg p-4 mb-3 font-mono"
              style={{ borderLeftColor: c }}
            >
              <div className="flex justify-between items-center mb-3">
                <span className="font-bold text-sm" style={{ color: c }}>
                  {isBuy ? "📈 BUY" : "📉 SELL"}
                </span>
                <span className="text-[#4a5568] text-xs">#{pos.ticket}</span>
                <span
                  className="font-bold text-lg"
                  style={{ color: pos.profit >= 0 ? "#00ff9d" : "#ff3d5a" }}
                >
                  ${Number(pos.profit || 0).toFixed(2)}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center mb-3">
                <div>
                  <div className="text-[9px] text-[#4a5568] uppercase">
                    Volume
                  </div>
                  <div className="text-[#e8edf5] text-xs font-semibold mt-1">
                    {pos.volume}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-[#4a5568] uppercase">
                    Open
                  </div>
                  <div className="text-[#e8edf5] text-xs font-semibold mt-1">
                    {pos.price_open}
                  </div>
                </div>
                <div>
                  <div className="text-[9px] text-[#4a5568] uppercase">
                    Current
                  </div>
                  <div className="text-[#00c6ff] text-xs font-semibold mt-1">
                    {pos.price_current}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="bg-[#1a0a0d] rounded p-2">
                  <div className="text-[9px] text-[#4a5568] uppercase">SL</div>
                  <div className="text-[#ff3d5a] text-xs font-bold mt-1">
                    {pos.sl}
                  </div>
                </div>
                <div className="bg-[#0a1a12] rounded p-2">
                  <div className="text-[9px] text-[#4a5568] uppercase">TP</div>
                  <div className="text-[#00ff9d] text-xs font-bold mt-1">
                    {pos.tp}
                  </div>
                </div>
              </div>
            </div>
          );
        })
      )}
    </div>
  );
}
