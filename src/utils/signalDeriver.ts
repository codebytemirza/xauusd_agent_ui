import { AnalysisResponse, SignalType } from '../types';

export function deriveSignal(analysis: AnalysisResponse): SignalType {
  let bullishPOIs = 0;
  let bearishPOIs = 0;

  analysis.pois.forEach((poi) => {
    if (poi.type.startsWith('bullish_')) bullishPOIs++;
    if (poi.type.startsWith('bearish_')) bearishPOIs++;
  });

  const lastSweep = analysis.sweeps.length > 0 ? analysis.sweeps[analysis.sweeps.length - 1] : null;
  const lastBreakout = analysis.breakouts.length > 0 ? analysis.breakouts[analysis.breakouts.length - 1] : null;

  const isBullishSweep = lastSweep?.direction === 'bullish';
  const isBullishBreakout = lastBreakout?.direction === 'bullish';
  
  const isBearishSweep = lastSweep?.direction === 'bearish';
  const isBearishBreakout = lastBreakout?.direction === 'bearish';

  if (isBullishSweep && isBullishBreakout && bullishPOIs > bearishPOIs) {
    return 'BUY';
  }

  if (isBearishSweep && isBearishBreakout && bearishPOIs > bullishPOIs) {
    return 'SELL';
  }

  return 'WAIT';
}

export function generateAnalysisSummary(analysis: AnalysisResponse, signal: SignalType): string {
  let bias = 'NEUTRAL';
  if (signal === 'BUY') bias = 'BULLISH';
  if (signal === 'SELL') bias = 'BEARISH';

  const bullishPOIs = analysis.pois.filter(p => p.type.startsWith('bullish'));
  const bearishPOIs = analysis.pois.filter(p => p.type.startsWith('bearish'));

  const poisSummary = analysis.pois
    .slice(0, 3)
    .map(p => ` - ${p.type.toUpperCase()}: ${p.zone_low.toFixed(2)} - ${p.zone_high.toFixed(2)} [${p.status}]`)
    .join('\n');

  const sweepCount = analysis.summary.sweeps;
  const breakoutCount = analysis.summary.breakouts;

  const lastSweep = analysis.sweeps.at(-1)?.direction || 'None';
  const lastBreakout = analysis.breakouts.at(-1)?.direction || 'None';
  
  const signalEmoji = signal === 'BUY' ? '🟢 BUY' : signal === 'SELL' ? '🔴 SELL' : '⏳ WAIT';
  
  return `Market Bias: ${bias}
Swing Structure: ${analysis.summary.swing_highs} highs, ${analysis.summary.swing_lows} lows detected
Active POIs (Top 3):
${poisSummary || ' - None found'}

Sweeps Detected: ${sweepCount} (Last: ${lastSweep})
Breakouts Detected: ${breakoutCount} (Last: ${lastBreakout})

7MS Signal: ${signalEmoji}
Reason: AI determined based on sweep/breakout concurrence and POI density.`;
}
