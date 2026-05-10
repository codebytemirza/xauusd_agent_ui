import React, { useEffect, useRef } from "react";
import {
  createChart,
  CandlestickSeries,
  IChartApi,
  ISeriesApi,
  Time,
  createSeriesMarkers,
  ISeriesMarkersPluginApi,
  ISeriesPrimitive,
} from "lightweight-charts";
import { AnalysisResponse, Candle } from "../types";
import { toUnixTime } from "../utils/chartHelpers";
import { BoxPrimitive } from "./BoxPrimitive";

interface ChartPanelProps {
  candles: Candle[];
  analysis: AnalysisResponse | null;
}

// Map POI type → [fillColor, borderColor]
const POI_COLORS: Record<string, [string, string]> = {
  bullish_ob:  ["#0a2e1a", "#00CC88"],
  bearish_ob:  ["#2e0a0a", "#FF4444"],
  bullish_fvg: ["#0a1f2e", "#22aaff"],
  bearish_fvg: ["#2e1a00", "#ff8800"],
  bullish_2cb: ["#0a2218", "#00e5a0"],
  bearish_2cb: ["#2a0a1a", "#ff3377"],
};

export function ChartPanel({ candles, analysis }: ChartPanelProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);
  const markersRef = useRef<ISeriesMarkersPluginApi<Time> | null>(null);
  const primitivesRef = useRef<ISeriesPrimitive<Time>[]>([]);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: { background: { color: "#131722" }, textColor: "#d1d5db" },
      grid: {
        vertLines: { color: "#1e2433" },
        horzLines: { color: "#1e2433" },
      },
      crosshair: { mode: 0 },
      rightPriceScale: { borderColor: "#1e2433" },
      timeScale: {
        borderColor: "#1e2433",
        timeVisible: true,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#26a69a",
      downColor: "#ef5350",
      borderUpColor: "#26a69a",
      borderDownColor: "#ef5350",
      wickUpColor: "#26a69a",
      wickDownColor: "#ef5350",
    });

    seriesRef.current = series;
    markersRef.current = createSeriesMarkers(series);

    const handleResize = () => {
      if (containerRef.current) {
        chart.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
    };
  }, []);

  // Update data when candles change
  useEffect(() => {
    if (seriesRef.current && candles.length > 0) {
      const data = candles
        .map((c) => ({
          time: toUnixTime(c.time),
          open: c.open,
          high: c.high,
          low: c.low,
          close: c.close,
        }))
        .sort((a, b) => (a.time as number) - (b.time as number));

      seriesRef.current.setData(data);
    }
  }, [candles]);

  // Update overlays when analysis changes — now fully driven by SMC backend data
  useEffect(() => {
    if (!seriesRef.current || !chartRef.current) return;

    // Cleanup old boxes
    primitivesRef.current.forEach((p) =>
      seriesRef.current?.detachPrimitive?.(p),
    );
    primitivesRef.current = [];

    if (!analysis) {
      markersRef.current?.setMarkers([]);
      return;
    }

    const markers: any[] = [];

    // ── 1. Swing High / Low markers from backend ──────────────────────────────
    analysis.swing_highs.forEach((sh) => {
      markers.push({
        time: toUnixTime(sh.time),
        position: "aboveBar",
        color: "#FF4444",
        shape: "arrowDown",
        text: "SH",
        size: 1,
      });
    });
    analysis.swing_lows.forEach((sl) => {
      markers.push({
        time: toUnixTime(sl.time),
        position: "belowBar",
        color: "#00CC88",
        shape: "arrowUp",
        text: "SL",
        size: 1,
      });
    });

    // ── 2. BOS / CHoCH lines from backend breakouts ──────────────────────────
    analysis.breakouts.forEach((br) => {
      if (!br.break_time || !br.swing_price) return;
      const isBullish = br.type === "bullish_break";
      markers.push({
        time: toUnixTime(br.break_time),
        position: isBullish ? "belowBar" : "aboveBar",
        color: isBullish ? "#6366f1" : "#ec4899",
        shape: "circle",
        text: "BOS",
        size: 0.5,
      });
    });

    // ── 3. POI Boxes from SMC backend — only active ones ─────────────────────
    const lastCandleTime = candles.length > 0
      ? toUnixTime(candles[candles.length - 1].time)
      : 0;

    const activePois = analysis.pois.filter((p) => p.status === "active");

    activePois.forEach((poi) => {
      const [fillColor, borderColor] = POI_COLORS[poi.type] ?? ["#1a1a2e", "#888888"];

      // Determine start time from c1_time
      const startTime = poi.c1_time
        ? toUnixTime(poi.c1_time)
        : null;

      if (!startTime || !seriesRef.current?.attachPrimitive) return;

      const box = new BoxPrimitive({
        time1: startTime,
        time2: lastCandleTime,   // extend box to current price action
        price1: poi.zone_low,
        price2: poi.zone_high,
        color: fillColor,
        borderColor,
        opacity: 0.55,
      });

      seriesRef.current.attachPrimitive(box);
      primitivesRef.current.push(box);
    });

    // Also draw recently mitigated POIs with low opacity (last 3 only)
    const mitigatedPois = analysis.pois
      .filter((p) => p.status === "fully_mitigated")
      .slice(-3);

    mitigatedPois.forEach((poi) => {
      const [fillColor, borderColor] = POI_COLORS[poi.type] ?? ["#1a1a2e", "#888888"];
      const startTime = poi.c1_time ? toUnixTime(poi.c1_time) : null;
      const endTime = poi.c3_time ?? poi.c2_time;

      if (!startTime || !endTime || !seriesRef.current?.attachPrimitive) return;

      const box = new BoxPrimitive({
        time1: startTime,
        time2: toUnixTime(endTime),
        price1: poi.zone_low,
        price2: poi.zone_high,
        color: fillColor,
        borderColor,
        opacity: 0.15,
      });
      seriesRef.current.attachPrimitive(box);
      primitivesRef.current.push(box);
    });

    // Sort markers by time as required by lightweight-charts
    markers.sort((a, b) => (a.time as number) - (b.time as number));

    try {
      markersRef.current?.setMarkers(markers);
    } catch (e) {
      console.error("Failed to set markers", e);
    }
  }, [analysis, candles]);

  return (
    <div className="flex-1 w-full bg-[radial-gradient(#1f2937_1px,transparent_1px)] [background-size:20px_20px] relative flex flex-col">
      {!candles.length && (
        <div className="absolute inset-0 flex items-center justify-center text-gray-500 z-10 font-bold tracking-wider uppercase text-sm">
          Click "Load Chart" to fetch data
        </div>
      )}
      <div ref={containerRef} className="flex-1 w-full relative z-0" />
      <div className="h-10 border-t border-gray-800 bg-gray-900/50 flex items-center px-4 justify-between pointer-events-none z-10">
        <div className="text-[10px] font-mono text-gray-500 uppercase">
          {candles.length > 0
            ? `${new Date(candles[0].time).toLocaleDateString()} — ${new Date(candles[candles.length - 1].time).toLocaleDateString()}`
            : "NO DATA"}
        </div>
        <div className="flex space-x-3 text-[10px] font-mono items-center">
          <span className="text-[#FF4444]">▼ SH</span>
          <span className="text-[#00CC88]">▲ SL</span>
          <span className="text-[#00CC88] border border-[#00CC88] px-1 bg-[#0a2e1a]">BULL OB</span>
          <span className="text-[#FF4444] border border-[#FF4444] px-1 bg-[#2e0a0a]">BEAR OB</span>
          <span className="text-[#22aaff] border border-[#22aaff] px-1 bg-[#0a1f2e]">FVG</span>
          <span className="text-[#00e5a0] border border-[#00e5a0] px-1 bg-[#0a2218]">2CB</span>
          <span className="text-[#6366f1]">● BOS</span>
        </div>
      </div>
    </div>
  );
}
