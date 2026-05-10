import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../lib/utils';
import { Server, Activity } from 'lucide-react';

export function HealthBadge() {
  const [isHealthy, setIsHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/health`);
        setIsHealthy(response.ok);
      } catch (error) {
        setIsHealthy(false);
      }
    };
    
    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (isHealthy === null) {
    return (
       <div className="flex items-center space-x-2 ml-4 bg-gray-950/50 px-3 py-1.5 rounded-full border border-gray-800">
         <Activity className="w-3 h-3 animate-pulse text-gray-400" />
         <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Connecting...</span>
       </div>
    );
  }

  if (isHealthy === false) {
    return (
      <div className="flex items-center space-x-2 ml-4 bg-red-950/20 px-3 py-1.5 rounded-full border border-red-900">
        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)] animate-pulse" />
        <span className="text-[10px] font-bold uppercase tracking-widest text-red-500">Backend offline</span>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2 ml-4 bg-gray-950/50 px-3 py-1.5 rounded-full border border-gray-800">
      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-green-500">MT5 Connected</span>
    </div>
  );
}
