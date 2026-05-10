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

  // Update overlays when analysis changes
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

    // Swings Filtering
    const filteredSwings: any[] = [];
    const len = candles.length;
    for (let i = 5; i < len - 3; i++) {
      const c = candles[i];

      // Swing High
      let isSH = true;
      for (let j = i - 5; j <= i + 3; j++) {
        if (i !== j && candles[j].high >= c.high) isSH = false;
      }
      if (isSH)
        filteredSwings.push({
          type: "SH",
          time: c.time,
          price: c.high,
          index: i,
        });

      // Swing Low
      let isSL = true;
      for (let j = i - 5; j <= i + 3; j++) {
        if (i !== j && candles[j].low <= c.low) isSL = false;
      }
      if (isSL)
        filteredSwings.push({
          type: "SL",
          time: c.time,
          price: c.low,
          index: i,
        });
    }

    filteredSwings.sort((a, b) => a.index - b.index);
    const dedupedSH: any[] = [];
    filteredSwings
      .filter((s) => s.type === "SH")
      .forEach((sh) => {
        if (dedupedSH.length > 0) {
          const prev = dedupedSH[dedupedSH.length - 1];
          if (sh.index - prev.index <= 5) {
            if (sh.price > prev.price) dedupedSH[dedupedSH.length - 1] = sh;
            return;
          }
        }
        dedupedSH.push(sh);
      });

    const dedupedSL: any[] = [];
    filteredSwings
      .filter((s) => s.type === "SL")
      .forEach((sl) => {
        if (dedupedSL.length > 0) {
          const prev = dedupedSL[dedupedSL.length - 1];
          if (sl.index - prev.index <= 5) {
            if (sl.price < prev.price) dedupedSL[dedupedSL.length - 1] = sl;
            return;
          }
        }
        dedupedSL.push(sl);
      });

    const combinedSwings = [...dedupedSH, ...dedupedSL].sort(
      (a, b) => a.index - b.index,
    );
    combinedSwings.forEach((s) => {
      markers.push({
        time: toUnixTime(s.time),
        position: s.type === "SH" ? "aboveBar" : "belowBar",
        color: s.type === "SH" ? "#FF4444" : "#00CC88",
        shape: s.type === "SH" ? "arrowDown" : "arrowUp",
        text: s.type,
        size: 1,
      });
    });

    // POIs (Order Blocks)
    const avgCandleRange =
      candles.reduce((acc, c) => acc + (c.high - c.low), 0) /
      (candles.length || 1);
    const allOBs: any[] = [];

    for (let i = 2; i < candles.length - 2; i++) {
      // Bullish impulse over 1 or 2 candles
      const impulseUp =
        candles[i].close -
          candles[i].open +
          (candles[i + 1]?.close - candles[i + 1]?.open) >
        1.5 * avgCandleRange;
      if (impulseUp && candles[i].close > candles[i].open) {
        let obIndex = -1;
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          if (candles[j].close < candles[j].open) {
            obIndex = j;
            break;
          }
        }
        if (obIndex !== -1 && !allOBs.some((ob) => ob.startIndex === obIndex)) {
          allOBs.push({
            isBullish: true,
            startIndex: obIndex,
            zone_high: candles[obIndex].high,
            zone_low: candles[obIndex].low,
          });
        }
      }

      // Bearish impulse over 1 or 2 candles
      const impulseDown =
        candles[i].open -
          candles[i].close +
          (candles[i + 1]?.open - candles[i + 1]?.close) >
        1.5 * avgCandleRange;
      if (impulseDown && candles[i].close < candles[i].open) {
        let obIndex = -1;
        for (let j = i - 1; j >= Math.max(0, i - 10); j--) {
          if (candles[j].close > candles[j].open) {
            obIndex = j;
            break;
          }
        }
        if (obIndex !== -1 && !allOBs.some((ob) => ob.startIndex === obIndex)) {
          allOBs.push({
            isBullish: false,
            startIndex: obIndex,
            zone_high: candles[obIndex].high,
            zone_low: candles[obIndex].low,
          });
        }
      }
    }

    const processedOBs: any[] = [];

    allOBs.forEach((ob) => {
      let isMitigated = false;
      let mitigatedIndex = ob.startIndex;

      for (let i = ob.startIndex + 1; i < candles.length; i++) {
        const c = candles[i];
        if (ob.isBullish && c.close < ob.zone_low) {
          isMitigated = true;
          mitigatedIndex = i;
          break;
        } else if (!ob.isBullish && c.close > ob.zone_high) {
          isMitigated = true;
          mitigatedIndex = i;
          break;
        }
      }

      if (isMitigated && candles.length - 1 - mitigatedIndex > 20) {
        return;
      }

      let endIndex = isMitigated ? mitigatedIndex : candles.length - 1;
      processedOBs.push({ ...ob, endIndex, isMitigated });
    });

    const activeBullish = processedOBs
      .filter((ob) => ob.isBullish && !ob.isMitigated)
      .slice(-3); // max 3
    const activeBearish = processedOBs
      .filter((ob) => !ob.isBullish && !ob.isMitigated)
      .slice(-3); // max 3
    const mitigatedToKeep = processedOBs.filter((ob) => ob.isMitigated);

    let finalOBs = [...activeBullish, ...activeBearish, ...mitigatedToKeep];

    if (finalOBs.length === 0 && processedOBs.length > 0) {
      finalOBs = processedOBs.slice(-2);
    }

    finalOBs.forEach((ob) => {
      let color = ob.isBullish ? "#1a472a" : "#4a1a1a";
      let borderColor = ob.isBullish ? "#00CC88" : "#FF4444";
      let opacity = ob.isMitigated ? 0.15 : 0.55;

      if (seriesRef.current?.attachPrimitive) {
        const box = new BoxPrimitive({
          time1: toUnixTime(candles[ob.startIndex].time),
          time2: toUnixTime(candles[ob.endIndex].time),
          price1: ob.zone_low,
          price2: ob.zone_high,
          color,
          borderColor,
          opacity,
        });
        seriesRef.current.attachPrimitive(box);
        primitivesRef.current.push(box);
      }
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
        <div className="flex space-x-4 text-[10px] font-mono">
          <span className="text-[#FF4444]">▼ SH</span>
          <span className="text-[#00CC88]">▲ SL</span>
          <span className="text-[#00CC88] border-y border-[#00CC88] px-1 bg-[#1a472a]">
            BULL OB
          </span>
          <span className="text-[#FF4444] border-y border-[#FF4444] px-1 bg-[#4a1a1a]">
            BEAR OB
          </span>
        </div>
      </div>
    </div>
  );
}
