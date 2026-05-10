export interface Candle {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  tick_volume?: number;
  volume?: number;
  spread?: number;
}

// POI types from SMC: bullish_ob, bearish_ob, bullish_fvg, bearish_fvg, bullish_2cb, bearish_2cb
export interface POI {
  type: string;
  zone_low: number;
  zone_high: number;
  c1_time?: string;
  c3_time?: string;
  c2_time?: string;
  status: "active" | "partially_mitigated" | "fully_mitigated";
}

// BOS/CHoCH from SMC bos_choch — no swing_index anymore
export interface Breakout {
  type: "bullish_break" | "bearish_break" | string;
  swing_price?: number;
  break_index?: number;
  break_time?: string;
  break_close?: number;
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
  sweeps: never[];           // always empty — SMC handles internally
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
