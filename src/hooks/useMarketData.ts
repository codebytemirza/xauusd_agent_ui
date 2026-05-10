import { useState, useCallback } from 'react';
import { Candle } from '../types';
import { API_BASE_URL } from '../lib/utils';
import { useToast } from './useToast';

export function useMarketData() {
  const [candles, setCandles] = useState<Candle[]>([]);
  const [isLoadingChart, setIsLoadingChart] = useState(false);
  const { addToast } = useToast();

  const fetchCandles = useCallback(async (symbol: string, timeframe: string) => {
    setIsLoadingChart(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/rates/from-pos?symbol=${symbol}&timeframe=${timeframe}&count=300`);
      if (!response.ok) {
        throw new Error('Failed to fetch candles');
      }
      const json = await response.json();
      const data: Candle[] = Array.isArray(json) ? json : json.candles || [];
      if (!data || data.length === 0) {
        addToast(`Loaded undefined candles for ${symbol} it returned no data.`, 'error');
        setCandles([]);
      } else {
        setCandles(data);
        addToast(`Loaded ${data.length} candles for ${symbol}`, 'success');
      }
    } catch (error) {
      console.error(error);
      addToast('Error loading chart data', 'error');
    } finally {
      setIsLoadingChart(false);
    }
  }, [addToast]);

  return {
    candles,
    isLoadingChart,
    fetchCandles
  };
}
