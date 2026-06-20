import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, MessageSquare, Heart, Shield } from 'lucide-react';
import { ChatMessage } from '../types';
import { sendMessage } from '../firebaseUtils';

interface AnonymChatProps {
  roomCode: string;
  messages: ChatMessage[];
  playerId: string;
  playerNickname: string;
}

export default function AnonymChat({ roomCode, messages, playerId, playerNickname }: AnonymChatProps) {
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const textToSend = inputText.trim();
    if (!textToSend || isSending) return;

    setIsSending(true);
    setInputText('');
    try {
      await sendMessage(roomCode, playerId, playerNickname, textToSend);
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="flex flex-col h-[400px] md:h-[550px] bento-box bg-neutral-900/60 border border-neutral-800 overflow-hidden" id="anonymous-chat-root">
      {/* Chat header */}
      <div className="bg-neutral-950 border-b border-neutral-800/80 px-4 py-4 flex items-center justify-between select-none">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-950/20 rounded-xl border border-rose-900/40">
            <MessageSquare className="w-4 h-4 text-rose-500" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-neutral-200 uppercase tracking-widest leading-none">
              Анонимный шепот 🤫
            </h3>
            <span className="text-[9px] text-neutral-500 font-medium block mt-1">Приватный канал связи пары</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[9px] text-rose-400 font-semibold bg-rose-950/20 px-2.5 py-1 border border-rose-900/35 rounded-full uppercase tracking-wider font-mono">
          <Shield className="w-3 h-3 text-rose-500" />
          <span>Защищено</span>
        </div>
      </div>

      {/* Messages list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col justify-center items-center text-center px-4">
            <Heart className="w-8 h-8 text-rose-500/10 fill-rose-500/5 animate-pulse mb-3" />
            <p className="text-xs text-neutral-500 max-w-xs leading-relaxed">Чат полностью анонимен. Общайтесь здесь, отправляйте признания или выполняйте задания!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isSelf = msg.senderId === playerId;
            
            // System message styling
            if (msg.isSystem) {
              return (
                <div 
                  key={msg.id} 
                  className="w-full flex justify-center py-1 animate-fade-in"
                >
                  <p className="bg-rose-950/15 border border-rose-900/25 text-rose-300 text-[10px] rounded-xl px-3 py-1.5 max-w-[90%] text-center font-semibold tracking-wider font-sans leading-relaxed">
                    {msg.text}
                  </p>
                </div>
              );
            }

            return (
              <div 
                key={msg.id} 
                className={`flex flex-col max-w-[85%] ${isSelf ? 'self-end' : 'self-start'}`}
              >
                {/* Sender Nickname */}
                <span className={`text-[9px] text-neutral-500 font-bold uppercase tracking-widest mb-1 px-1 ${isSelf ? 'self-end' : 'self-start'}`}>
                  {isSelf ? 'Вы' : msg.senderName}
                </span>

                {/* Message Bubble */}
                <div 
                  className={`rounded-2xl px-4 py-2.5 text-xs shadow-md transition-all leading-relaxed ${
                    isSelf 
                      ? 'bg-rose-600 text-white rounded-tr-none font-medium' 
                      : 'bg-neutral-950 border border-neutral-800 text-neutral-200 rounded-tl-none font-normal'
                  }`}
                >
                  <p className="break-words chat-message-text">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input form */}
      <form onSubmit={handleSend} className="p-3.5 border-t border-neutral-800/80 bg-neutral-950/80 flex gap-2">
        <input
          type="text"
          maxLength={150}
          placeholder="Напишите тайное откровение..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="flex-1 bg-neutral-900 border border-neutral-800 focus:border-rose-600 rounded-xl px-4 py-2.5 text-xs text-neutral-100 placeholder-neutral-600 focus:outline-none transition-all font-sans"
        />
        <button
          type="submit"
          disabled={!inputText.trim() || isSending}
          className="bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white p-2.5 rounded-xl transition-all font-semibold active:scale-95 duration-200 cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
