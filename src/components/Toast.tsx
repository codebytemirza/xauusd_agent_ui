import React from 'react';
import { useToast } from '../hooks/useToast';
import { cn } from '../lib/utils';
import { X } from 'lucide-react';

export function ToastContainer() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map(toast => (
        <div 
          key={toast.id}
          className={cn(
            "flex items-center justify-between min-w-[300px] px-4 py-3 rounded-lg border shadow-lg text-sm font-medium",
            toast.type === 'success' && "bg-green-950/50 border-green-900 text-green-400",
            toast.type === 'error' && "bg-red-950/50 border-red-900 text-red-400",
            toast.type === 'info' && "bg-gray-800 border-gray-700 text-gray-200"
          )}
        >
          <span>{toast.message}</span>
          <button 
            onClick={() => removeToast(toast.id)}
            className="p-1 hover:bg-white/10 rounded-md transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
