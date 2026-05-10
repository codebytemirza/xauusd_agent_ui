import { useState, useCallback, useRef } from 'react';
import { AnalysisResponse, Candle, SignalType } from '../types';
import { API_BASE_URL } from '../lib/utils';
import { useToast } from './useToast';

export interface AgentAction {
  name: string;
  args: any;
}

export interface AgentEvent {
  id: string;
  type: 'message' | 'tool_call' | 'tool_result' | 'signal' | 'interrupt' | 'node' | 'error' | 'done';
  content?: string;
  tool?: string;
  args?: any;
  result?: any;
  signal?: SignalType;
  message?: string;
  actions?: AgentAction[];
  node?: string;
  summary?: string;
}

export function useAnalysis() {
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [signal, setSignal] = useState<SignalType>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Streaming state for AI Agent
  const [agentLogs, setAgentLogs] = useState<AgentEvent[]>([]);
  const [pendingActions, setPendingActions] = useState<AgentAction[] | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const { addToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);

  const runAnalysis = useCallback(async (symbol: string, timeframe: string, candles: Candle[]) => {
    if (candles.length === 0) return null;
    
    setIsAnalyzing(true);
    setAnalysis(null);
    setSignal(null);
    setAgentLogs([{ id: Date.now().toString(), type: 'message', content: '> Initiating 7MS AI Deep Agent Stream...\n' }]);
    setPendingActions(null);
    setThreadId(null);

    // Cancel any ongoing stream
    if (abortControllerRef.current) {
        abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      // 1. Fetch Chart Analysis for overlays (run concurrently, not blocking)
      fetch(`${API_BASE_URL}/api/analysis/full`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candles })
      })
      .then(res => res.json())
      .then(data => setAnalysis(data))
      .catch(err => {
         console.error(err);
         addToast('Chart overlays failed to load', 'error');
      });

      // 2. Start AI Agent Stream
      const response = await fetch(`${API_BASE_URL}/api/agent/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ symbol, timeframe }),
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Agent request failed:", response.status, errorText);
        throw new Error(`Agent request failed: ${response.status} ${errorText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader available");

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Process SSE lines
        const lines = buffer.split('\n');
        buffer = lines.pop() || ""; // keep the last partial line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (!dataStr.trim()) continue;
            
            try {
              const event = JSON.parse(dataStr);
              event.id = Math.random().toString(36).substr(2, 9);
              
              setAgentLogs(prev => [...prev, event]);

              switch(event.type) {
                case 'signal':
                  setSignal(event.signal);
                  break;
                case 'interrupt':
                  setThreadId(event.thread_id);
                  setPendingActions(event.actions);
                  setIsAnalyzing(false); // Paused for HITL
                  break;
                case 'done':
                  setThreadId(event.thread_id);
                  setIsAnalyzing(false);
                  break;
                case 'error':
                  setIsAnalyzing(false);
                  break;
              }
            } catch (e) {
              console.error("Error parsing SSE event", e, dataStr);
            }
          }
        }
      }
      
      setIsAnalyzing(false);
      addToast('Analysis stream finished', 'success');
      return true;
    } catch (error: any) {
      if (error.name === 'AbortError') return;
      console.error(error);
      addToast('Error running AI analysis', 'error');
      setAgentLogs(prev => [...prev, { id: Date.now().toString(), type: 'error', message: error.message }]);
      setIsAnalyzing(false);
      return null;
    }
  }, [addToast]);

  const sendDecision = useCallback(async (decision: 'approve' | 'reject' | 'edit', reason?: string, action_name?: string, edited_args?: any) => {
    if (!threadId) return;
    setIsAnalyzing(true);
    setPendingActions(null);
    setAgentLogs(prev => [...prev, { id: Date.now().toString(), type: 'message', content: `\n[HITL] User sent decision: ${decision.toUpperCase()}\n` }]);

    try {
      const response = await fetch(`${API_BASE_URL}/api/agent/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
           thread_id: threadId, 
           decision, 
           reason, 
           action_name, 
           edited_args 
        }),
      });

      if (!response.ok) {
        throw new Error('Decision request failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) throw new Error("No reader available");

      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.substring(6);
            if (!dataStr.trim()) continue;
            try {
              const event = JSON.parse(dataStr);
              event.id = Math.random().toString(36).substr(2, 9);
              
              setAgentLogs(prev => [...prev, event]);

              switch(event.type) {
                case 'signal':
                  setSignal(event.signal);
                  break;
                case 'interrupt':
                  setPendingActions(event.actions);
                  setIsAnalyzing(false);
                  break;
                case 'done':
                  setIsAnalyzing(false);
                  break;
                case 'error':
                  setIsAnalyzing(false);
                  break;
              }
            } catch (e) {
               console.error("Error parsing SSE", e);
            }
          }
        }
      }
      setIsAnalyzing(false);
    } catch(err) {
      console.error(err);
      addToast('Error sending decision', 'error');
      setIsAnalyzing(false);
    }
  }, [threadId, addToast]);

  return {
    analysis,
    runAnalysis,
    isAnalyzing,
    signal,
    agentLogs,
    pendingActions,
    sendDecision
  };
}

