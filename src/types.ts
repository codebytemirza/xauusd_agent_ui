export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  tick_volume?: number;
  spread?: number;
  real_volume?: number;
}

export interface POI {
  type: string;
  zone_low: number;
  zone_high: number;
  c1_time: string;
  status: "active" | "partially_mitigated" | "fully_mitigated";
}

export interface Breakout {
  type: string;
  swing_price?: number;
  swing_time?: string;
  swing_index?: number;
  break_index?: number;
  break_time?: string;
  break_close?: number;
  break_price?: number; // legacy
  break_candle_time?: string; // legacy
  direction?: "bullish" | "bearish"; // legacy
}

export interface Sweep {
  type: string;
  swing_price?: number;
  swing_time?: string;
  sweep_start_index?: number;
  sweep_start_time?: string;
  sweep_candle_count?: number;
  wick_high?: number;
  wick_low?: number;
  swept_price?: number; // legacy
  sweep_candle_time?: string; // legacy
  direction?: "bullish" | "bearish"; // legacy
}

export interface Swing {
  index: number;
  price: number;
  time: string;
}

export interface AnalysisResponse {
  candle_count: number;
  swing_highs: Swing[];
  swing_lows: Swing[];
  sweeps: Sweep[];
  breakouts: Breakout[];
  pois: POI[];
  summary: {
    swing_highs: number;
    swing_lows: number;
    sweeps: number;
    breakouts: number;
    pois: number;
    pois_by_type: Record<string, number>;
  };
}

export type SignalType = "BUY" | "SELL" | "WAIT" | null;
