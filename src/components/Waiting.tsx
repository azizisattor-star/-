import React, { useState } from 'react';
import { Copy, Check, Users, Loader, LogOut } from 'lucide-react';

interface WaitingProps {
  roomCode: string;
  onExit: () => void;
}

export default function Waiting({ roomCode, onExit }: WaitingProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-lg mx-auto py-12" id="waiting-container">
      <div className="bento-box p-8 text-center shadow-2xl relative overflow-hidden bg-neutral-900/60 border border-neutral-800">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-rose-500/5 rounded-full blur-xl" />

        <div className="flex justify-center mb-6">
          <div className="p-4 bg-neutral-950 rounded-full border border-neutral-800 relative">
            <Users className="w-8 h-8 text-rose-500" />
            <span className="absolute top-1 right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-rose-500"></span>
            </span>
          </div>
        </div>

        <h1 className="text-2xl font-display font-medium text-neutral-100 mb-2">
          Секретная связь
        </h1>
        <p className="text-xs text-neutral-400 mb-6 max-w-xs mx-auto leading-relaxed">
          Передайте этот 4-значный ключ вашему партнеру, чтобы соединить ваши устройства в единую сессию.
        </p>

        {/* Big Code display box with click-to-copy capability */}
        <div 
          onClick={handleCopy}
          className="bg-neutral-950 border border-neutral-800 hover:border-rose-600/50 rounded-3xl py-5 px-6 mb-6 flex items-center justify-between cursor-pointer hover:bg-neutral-950/80 transition-all group"
        >
          <div className="flex flex-col items-start gap-1">
            <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold">Ключ соединения:</span>
            <span className="text-4xl font-bold tracking-[0.25em] text-white neon-glow font-mono select-all uppercase">
              {roomCode}
            </span>
          </div>
          <div className="p-3 bg-rose-950/20 border border-rose-900/40 rounded-2xl text-rose-400 group-hover:text-rose-300 group-hover:scale-105 transition-all">
            {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <Copy className="w-5 h-5" />}
          </div>
        </div>

        <div className="flex items-center justify-center gap-2.5 text-[11px] text-rose-300 bg-rose-950/25 py-3 px-4 rounded-2xl border border-rose-900/30 mb-8 font-semibold">
          <Loader className="w-4 h-4 animate-spin text-rose-500" />
          <span>Канал открыт. Ожидание второго партнера...</span>
        </div>

        <button
          onClick={onExit}
          className="w-full flex items-center justify-center gap-2 text-xs font-bold uppercase tracking-widest text-neutral-500 hover:text-rose-500 border border-neutral-800 hover:border-rose-900/40 py-3.5 rounded-full transition-all cursor-pointer bg-transparent"
        >
          <LogOut className="w-4 h-4" />
          Прервать сеанс
        </button>
      </div>
    </div>
  );
}
