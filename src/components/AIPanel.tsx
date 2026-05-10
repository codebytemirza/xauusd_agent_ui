import React, { useEffect, useRef } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Loader2, Copy } from "lucide-react";
import { SignalType } from "../types";
import { useToast } from "../hooks/useToast";
import { cn } from "../lib/utils";
import { AgentAction, AgentEvent } from "../hooks/useAnalysis";

interface AIPanelProps {
  isAnalyzing: boolean;
  signal: SignalType;
  agentLogs: AgentEvent[];
  pendingActions: AgentAction[] | null;
  onDecision: (
    decision: "approve" | "reject" | "edit",
    reason?: string,
  ) => void;
}

export function AIPanel({
  isAnalyzing,
  signal,
  agentLogs,
  pendingActions,
  onDecision,
}: AIPanelProps) {
  const { addToast } = useToast();
  const scrollRef = useRef<HTMLDivElement>(null);

  const handleCopy = () => {
    navigator.clipboard.writeText(JSON.stringify(agentLogs, null, 2));
    addToast("Analysis logs copied to clipboard", "success");
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [agentLogs, pendingActions]);

  const badgeColor =
    isAnalyzing && !pendingActions
      ? "bg-amber-500/10 border-amber-500/50 text-amber-500"
      : pendingActions
        ? "bg-blue-500/10 border-blue-500/50 text-blue-400"
        : signal === "BUY"
          ? "bg-green-500/10 border-green-500/50 text-green-500"
          : signal === "SELL"
            ? "bg-red-500/10 border-red-500/50 text-red-500"
            : "bg-gray-500/10 border-gray-500/50 text-gray-400";

  const badgeText =
    isAnalyzing && !pendingActions
      ? "ANALYZING"
      : pendingActions
        ? "ACTION REQUIRED"
        : signal
          ? `${signal} SIGNAL`
          : "WAIT";

  const getToolMeta = (toolName: string) => {
    const meta: Record<string, { icon: string; color: string; label: string }> =
      {
        get_market_data: {
          icon: "📊",
          color: "text-sky-400 border-sky-400/30 bg-sky-400/10",
          label: "FETCHING MARKET DATA",
        },
        identify_order_blocks: {
          icon: "📦",
          color: "text-purple-400 border-purple-400/30 bg-purple-400/10",
          label: "MAPPING ORDER BLOCKS",
        },
        detect_liquidity_sweep: {
          icon: "💧",
          color: "text-cyan-400 border-cyan-400/30 bg-cyan-400/10",
          label: "SCANNING LIQUIDITY SWEEPS",
        },
        find_mss_and_poi: {
          icon: "🎯",
          color: "text-emerald-400 border-emerald-400/30 bg-emerald-400/10",
          label: "LOCATING MSS + POI",
        },
        send_order: {
          icon: "⚡",
          color: "text-rose-400 border-rose-400/30 bg-rose-400/10",
          label: "SENDING ORDER",
        },
        get_open_positions: {
          icon: "📈",
          color: "text-green-400 border-green-400/30 bg-green-400/10",
          label: "CHECKING POSITIONS",
        },
        write_analysis_file: {
          icon: "💾",
          color: "text-amber-400 border-amber-400/30 bg-amber-400/10",
          label: "WRITING ANALYSIS FILE",
        },
      };
    return (
      meta[toolName] || {
        icon: "🔧",
        color: "text-slate-400 border-slate-400/30 bg-slate-400/10",
        label: toolName.toUpperCase(),
      }
    );
  };

  const renderEvent = (event: AgentEvent) => {
    if (event.type === "message" && event.content) {
      // Check for final signal in message
      if (event.content.includes("7MS SIGNAL")) {
        const sigMatch =
          event.content.match(/FINAL SIGNAL:\s*(BUY|SELL|WAIT)/) ||
          event.content.match(/7MS SIGNAL:\s*(BUY|SELL|WAIT)/);
        const sig = sigMatch ? sigMatch[1] : "WAIT";
        const c =
          sig === "BUY" ? "#00ff9d" : sig === "SELL" ? "#ff3d5a" : "#f5c842";
        const ic = sig === "BUY" ? "📈" : sig === "SELL" ? "📉" : "⏳";
        return (
          <div
            key={event.id}
            className="my-4 p-5 rounded-xl border-2"
            style={{
              borderColor: `${c}66`,
              background: `linear-gradient(135deg, ${c}12, ${c}05)`,
            }}
          >
            <div
              className="text-center font-bold tracking-[0.15em] mb-3 text-sm"
              style={{ color: c }}
            >
              {ic} FINAL SIGNAL: {sig}
            </div>
            <div className="markdown-body font-mono text-[10px] sm:text-xs leading-relaxed text-gray-400 prose prose-invert w-full prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-800 prose-pre:text-gray-400 prose-code:text-gray-300 prose-p:my-1 prose-headings:my-2 prose-hr:border-gray-800 break-words opacity-80">
              <Markdown remarkPlugins={[remarkGfm]}>{event.content}</Markdown>
            </div>
          </div>
        );
      }
      return (
        <div
          key={event.id}
          className="markdown-body font-mono text-xs leading-relaxed text-gray-300 prose prose-invert w-full prose-pre:bg-gray-950 prose-pre:border prose-pre:border-gray-800 prose-pre:text-gray-400 prose-code:text-gray-300 prose-p:my-1 prose-headings:my-2 prose-hr:border-gray-800 break-words flex flex-col gap-2 bg-[#0d1219] border-l-[3px] border-[#f5c84244] p-3 rounded-lg my-2"
        >
          <div className="text-[9px] text-[#4a5568] tracking-widest flex items-center gap-2">
            <span>🤖</span> AGENT
          </div>
          <Markdown remarkPlugins={[remarkGfm]}>{event.content}</Markdown>
        </div>
      );
    }
    if (event.type === "tool_call") {
      const meta = getToolMeta(event.tool || "");
      const borderColorName = meta.color
        .match(/border-[a-z]+-\d+\/\d+/)?.[0]
        ?.replace(/\/\d+/, "");
      return (
        <div
          key={event.id}
          className={`bg-gray-950/50 border-l-[3px] border-t border-r border-b rounded-lg p-3 my-2 border-gray-800 ${borderColorName}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm">{meta.icon}</span>
            <span
              className={`font-bold text-[10px] uppercase tracking-widest ${meta.color.split(" ")[0]}`}
            >
              {meta.label}
            </span>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
            {event.args &&
              Object.entries(event.args).map(([k, v]) => (
                <React.Fragment key={k}>
                  <div className="text-[10px] text-gray-500">{k}</div>
                  <div className="text-[10px] text-gray-300 truncate">
                    {String(v)}
                  </div>
                </React.Fragment>
              ))}
          </div>
        </div>
      );
    }
    if (event.type === "tool_result") {
      let data = event.result;
      if (typeof data === "string") {
        try {
          data = JSON.parse(data);
        } catch (e) {}
      }

      if (event.tool === "get_market_data" && data?.latest_candle) {
        const lc = data.latest_candle;
        return (
          <div
            key={event.id}
            className="bg-gray-950/50 border border-gray-800 rounded-lg p-3 my-2 font-mono"
          >
            <div className="text-sky-400 text-[10px] font-bold tracking-widest mb-2">
              ◈ {data.timeframe} CANDLE — {data.symbol}
            </div>
            <div className="grid grid-cols-4 gap-2 mb-2">
              <div className="bg-black rounded p-1 text-center">
                <div className="text-[8px] text-gray-500 uppercase">open</div>
                <div className="text-gray-300 text-xs font-bold">{lc.open}</div>
              </div>
              <div className="bg-black rounded p-1 text-center">
                <div className="text-[8px] text-gray-500 uppercase">high</div>
                <div className="text-emerald-400 text-xs font-bold">
                  {lc.high}
                </div>
              </div>
              <div className="bg-black rounded p-1 text-center">
                <div className="text-[8px] text-gray-500 uppercase">low</div>
                <div className="text-rose-400 text-xs font-bold">{lc.low}</div>
              </div>
              <div className="bg-black rounded p-1 text-center">
                <div className="text-[8px] text-gray-500 uppercase">close</div>
                <div className="text-sky-400 text-xs font-bold">{lc.close}</div>
              </div>
            </div>
          </div>
        );
      }

      if (event.tool === "identify_order_blocks" && data) {
        return (
          <div
            key={event.id}
            className="bg-gray-950/50 border border-purple-900/30 rounded-lg p-3 my-2 font-mono"
          >
            <div className="text-purple-400 text-[10px] font-bold tracking-widest mb-2">
              ◈ {data.timeframe} ORDER BLOCKS ({data.order_blocks_found})
            </div>
            {data.order_blocks?.map((ob: any, i: number) => {
              const isBear = ob.type?.includes("bear");
              return (
                <div
                  key={i}
                  className={`bg-black/50 border-l-[3px] ${isBear ? "border-rose-500" : "border-emerald-500"} rounded p-2 my-1 grid grid-cols-[60px_1fr] items-center gap-2`}
                >
                  <span
                    className={`text-[9px] font-bold ${isBear ? "text-rose-500" : "text-emerald-500"}`}
                  >
                    {isBear ? "BEAR OB" : "BULL OB"}
                  </span>
                  <span className="text-[10px] text-gray-400">
                    {ob.zone_low} — {ob.zone_high}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }

      if (event.tool === "write_analysis_file" && data) {
        const ok = data.status === "success";
        return (
          <div
            key={event.id}
            className={`bg-gray-950/50 border ${ok ? "border-amber-900/30" : "border-rose-900/30"} border-l-[3px] ${ok ? "border-amber-500" : "border-rose-500"} rounded-lg p-3 my-2 flex items-center gap-3`}
          >
            <span className="text-lg">{ok ? "💾" : "❌"}</span>
            <div className="flex-1 min-w-0">
              <div
                className={`text-[10px] font-bold tracking-widest ${ok ? "text-amber-500" : "text-rose-500"}`}
              >
                {ok ? "FILE SAVED" : "WRITE FAILED"}
              </div>
              <div className="text-[9px] text-gray-500 mt-1 truncate">
                {data.path || data.file_path}
              </div>
            </div>
          </div>
        );
      }

      return (
        <div
          key={event.id}
          className="bg-gray-950 border border-gray-800 rounded p-2 my-1 max-h-32 overflow-y-auto hide-scrollbar"
        >
          <pre className="text-[9px] text-gray-500 whitespace-pre-wrap font-mono m-0">
            {typeof data === "string" ? data : JSON.stringify(data, null, 2)}
          </pre>
        </div>
      );
    }

    if (event.type === "error") {
      return (
        <div
          key={event.id}
          className="bg-red-950/30 border border-red-900/50 text-red-400 text-xs p-3 rounded-lg my-2 font-mono break-words"
        >
          ❌ Error: {event.message}
        </div>
      );
    }

    return null;
  };

  return (
    <>
      <div className="p-4 border-b border-gray-800 flex justify-between items-center shrink-0">
        <div className="flex items-center space-x-2">
          <span className="text-lg">🤖</span>
          <h2 className="font-bold uppercase tracking-tight text-sm">
            7MS AI Agent
          </h2>
        </div>
        <div className="flex space-x-2">
          <span
            className={cn(
              "px-2 py-0.5 rounded text-[10px] font-bold border flex items-center gap-1.5",
              badgeColor,
            )}
          >
            {signal && !isAnalyzing && !pendingActions
              ? signal === "BUY"
                ? "🟢 "
                : "🔴 "
              : ""}
            {isAnalyzing && !pendingActions && (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" />
            )}
            {badgeText}
          </span>
        </div>
      </div>

      <div className="flex-1 p-4 md:p-6 font-mono text-sm leading-relaxed overflow-hidden flex flex-col justify-between min-h-0 bg-gray-900 shadow-inner">
        <div
          ref={scrollRef}
          className="text-gray-300 space-y-2 overflow-y-auto pr-2 pb-4 flex-1 scroll-smooth hide-scrollbar flex flex-col w-full min-w-0"
        >
          {agentLogs.length === 0 && !isAnalyzing && (
            <div className="flex h-full items-center justify-center text-gray-500 uppercase font-bold text-xs tracking-wider">
              Run AI Analysis to see insights
            </div>
          )}

          {agentLogs.map((e, idx) => (
            <React.Fragment key={idx}>{renderEvent(e)}</React.Fragment>
          ))}

          {pendingActions &&
            pendingActions.length > 0 &&
            (() => {
              const EditingWrapper = () => {
                const [editingActionIndex, setEditingActionIndex] =
                  React.useState<number | null>(null);
                const [editedArgs, setEditedArgs] = React.useState<
                  Record<string, any>
                >({});

                return (
                  <div
                    style={{
                      background:
                        "linear-gradient(135deg, #ff3d5a12, #ff3d5a05)",
                    }}
                    className="mt-6 p-6 border-2 border-[#ff3d5a88] rounded-xl flex flex-col gap-4 shadow-lg font-mono"
                  >
                    <div className="text-center mb-2">
                      <div className="text-4xl">⚠️</div>
                      <div className="text-[#ff3d5a] text-[15px] font-bold tracking-[0.2em] uppercase mt-2">
                        Trade Approval Required
                      </div>
                      <div className="text-[#4a5568] text-[11px] mt-1">
                        Review carefully before approving
                      </div>
                    </div>

                    {pendingActions.map((action, i) => {
                      const direc = action.args?.direction?.toUpperCase() || "";
                      const c = direc === "BUY" ? "#00ff9d" : "#ff3d5a";
                      const ic = direc === "BUY" ? "📈" : "📉";

                      return (
                        <div
                          key={i}
                          className="bg-[#111827] border-2 rounded-xl p-5 my-2"
                          style={{ borderColor: `${c}55` }}
                        >
                          <div
                            className="text-center font-bold text-sm tracking-widest mb-4"
                            style={{ color: c }}
                          >
                            {ic} {direc} ORDER #{i + 1}
                          </div>

                          {editingActionIndex === i ? (
                            <div className="grid gap-3 mb-4">
                              {Object.keys(editedArgs || {}).map((key) => (
                                <div
                                  key={key}
                                  className="bg-[#0d1219] p-2 rounded flex flex-col gap-1"
                                >
                                  <label className="text-xs text-[#4a5568] uppercase tracking-wider">
                                    {key}
                                  </label>
                                  <input
                                    type="text"
                                    className="bg-transparent text-sm text-[#e8edf5] border-b border-[#2d3748] focus:border-[#00c6ff] outline-none py-1"
                                    value={editedArgs[key]}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      const num = Number(val);
                                      setEditedArgs({
                                        ...editedArgs,
                                        [key]:
                                          val.trim() !== "" && !isNaN(num)
                                            ? num
                                            : val,
                                      });
                                    }}
                                  />
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-2 gap-3 mb-4">
                              <div className="bg-[#0d1219] rounded-lg p-3 text-center">
                                <div className="text-[#4a5568] text-[9px] uppercase tracking-widest">
                                  Entry
                                </div>
                                <div
                                  className="text-xl font-bold mt-1"
                                  style={{ color: c }}
                                >
                                  {action.args?.entry_price || "—"}
                                </div>
                              </div>
                              <div className="bg-[#0d1219] rounded-lg p-3 text-center">
                                <div className="text-[#4a5568] text-[9px] uppercase tracking-widest">
                                  Lot Size
                                </div>
                                <div className="text-[#e8edf5] text-xl font-bold mt-1">
                                  {action.args?.lot_size || "—"}
                                </div>
                              </div>
                              <div className="bg-[#1a0a0d] rounded-lg p-3 text-center">
                                <div className="text-[#4a5568] text-[9px] uppercase tracking-widest">
                                  Stop Loss
                                </div>
                                <div className="text-[#ff3d5a] text-xl font-bold mt-1">
                                  {action.args?.sl_price || "—"}
                                </div>
                              </div>
                              <div className="bg-[#0a1a12] rounded-lg p-3 text-center">
                                <div className="text-[#4a5568] text-[9px] uppercase tracking-widest">
                                  Take Profit
                                </div>
                                <div className="text-[#00ff9d] text-xl font-bold mt-1">
                                  {action.args?.tp_price || "—"}
                                </div>
                              </div>
                            </div>
                          )}

                          {editingActionIndex === i ? (
                            <div className="flex gap-2 mt-4">
                              <button
                                onClick={() => {
                                  onDecision(
                                    "edit",
                                    undefined,
                                    action.name,
                                    editedArgs,
                                  );
                                  setEditingActionIndex(null);
                                }}
                                className="flex-1 bg-[#00c6ff] hover:bg-[#00c6ff]/80 text-[#080c14] text-[10px] font-bold py-2 rounded transition-colors uppercase tracking-widest"
                              >
                                💾 Save & Execute
                              </button>
                              <button
                                onClick={() => setEditingActionIndex(null)}
                                className="flex-1 bg-transparent hover:bg-white/5 border border-[#4a5568] text-gray-300 text-[10px] font-bold py-2 rounded transition-colors uppercase tracking-widest"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button
                                onClick={() => onDecision("approve")}
                                className="flex-1 bg-[#00ff9d] hover:bg-[#00ff9d]/80 text-[#080c14] text-[10px] font-bold py-2 rounded transition-colors uppercase tracking-widest"
                              >
                                ✅ Approve
                              </button>
                              <button
                                onClick={() => {
                                  setEditingActionIndex(i);
                                  setEditedArgs({ ...action.args });
                                }}
                                className="flex-1 bg-[#0d1219] hover:bg-[#1a2540] border border-[#2d3748] text-[#00c6ff] text-[10px] font-bold py-2 rounded transition-colors uppercase tracking-widest"
                              >
                                ✏️ Edit
                              </button>
                              <button
                                onClick={() =>
                                  onDecision(
                                    "reject",
                                    "Rejected manually by user.",
                                  )
                                }
                                className="flex-1 bg-transparent hover:bg-white/5 border border-[#4a5568] text-[#ff3d5a] text-[10px] font-bold py-2 rounded transition-colors uppercase tracking-widest"
                              >
                                ❌ Reject
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              };
              return <EditingWrapper />;
            })()}
        </div>

        <button
          onClick={handleCopy}
          disabled={agentLogs.length === 0}
          className="w-full bg-gray-950 border border-gray-800 hover:bg-gray-800 hover:text-white text-[10px] font-bold uppercase py-2.5 tracking-widest rounded-md mt-4 transition-all disabled:opacity-50 shrink-0 shadow-sm text-gray-400"
        >
          Copy Session Log
        </button>
      </div>
    </>
  );
}
