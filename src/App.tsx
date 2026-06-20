import React, { useState, useEffect } from 'react';
import Lobby from './components/Lobby';
import Waiting from './components/Waiting';
import GameBoard from './components/GameBoard';
import { RoomState, ChatMessage } from './types';
import { subscribeToRoom, subscribeToMessages, sendMessage } from './firebaseUtils';
import { Heart, RefreshCw } from 'lucide-react';

export default function App() {
  const [roomCode, setRoomCode] = useState<string | null>(() => {
    return localStorage.getItem('cupid_room_code');
  });
  const [playerId, setPlayerId] = useState<string | null>(() => {
    return localStorage.getItem('cupid_player_id');
  });
  const [nickname, setNickname] = useState<string | null>(() => {
    return localStorage.getItem('cupid_nickname');
  });

  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Setup synchronization subscriptions whenever room code changes
  useEffect(() => {
    if (!roomCode) {
      setRoomState(null);
      setMessages([]);
      return;
    }

    setLoading(true);
    let unsubRoom: (() => void) | null = null;
    let unsubMessages: (() => void) | null = null;

    try {
      // 1. Subscribe to Room changes
      unsubRoom = subscribeToRoom(roomCode, (updatedRoom) => {
        if (!updatedRoom) {
          setError('Комната была удалена или сессия завершилась.');
          handleLeave();
          setLoading(false);
          return;
        }

        setRoomState(updatedRoom);
        setLoading(false);
      });

      // 2. Subscribe to Chat Messages
      unsubMessages = subscribeToMessages(roomCode, (newMessages) => {
        setMessages(newMessages);
      });
    } catch (err: any) {
      console.error(err);
      setError('Не удалось подключиться к базе данных. Проверьте сеть.');
      setLoading(false);
    }

    // Unsubscribe on unmount or change
    return () => {
      if (unsubRoom) unsubRoom();
      if (unsubMessages) unsubMessages();
    };
  }, [roomCode]);

  // Handle successful room creation or registration
  const handleJoinSuccess = (code: string, id: string, name: string) => {
    const uppercaseCode = code.toUpperCase().trim();
    setRoomCode(uppercaseCode);
    setPlayerId(id);
    setNickname(name);

    localStorage.setItem('cupid_room_code', uppercaseCode);
    localStorage.setItem('cupid_player_id', id);
    localStorage.setItem('cupid_nickname', name);
    setError(null);
  };

  // Exit game room / clean states
  const handleLeave = async () => {
    if (roomCode && playerId && nickname) {
      try {
        // Send a leaving log standardly
        await sendMessage(roomCode, 'system', 'Искушение', `🚪 Игрок *${nickname}* покинул игру.`, true);
      } catch (err) {
        console.error('Leaving report error:', err);
      }
    }

    setRoomCode(null);
    setPlayerId(null);
    setNickname(null);
    setRoomState(null);
    setMessages([]);
    localStorage.removeItem('cupid_room_code');
    localStorage.removeItem('cupid_player_id');
    localStorage.removeItem('cupid_nickname');
  };

  return (
    <div className="min-h-screen flex flex-col justify-between py-4" id="app-root">
      
      {/* Top Main Navigation header */}
      <header className="mx-auto w-full max-w-6xl px-4 mb-8">
        <div className="bg-neutral-900/40 border border-neutral-800/60 p-5 rounded-[2rem] shadow-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-rose-600 rounded-full animate-pulse"></div>
            <h1 className="text-2xl font-black tracking-tighter uppercase font-display select-none">
              <span className="text-rose-600">Cupid</span> <span className="italic font-light text-neutral-100">Игрушка</span>
            </h1>
          </div>
          <div className="flex items-center gap-6 font-sans text-xs uppercase tracking-widest text-neutral-400">
            {roomCode ? (
              <>
                <div className="flex items-center gap-2 text-emerald-500 font-semibold">
                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
                  Близость Активна
                </div>
                <div className="bg-neutral-800/80 px-4 py-1.5 rounded-full border border-neutral-700/60 text-neutral-300">
                  ID Сессии: {roomCode}
                </div>
              </>
            ) : (
              <div className="text-rose-500/80 font-semibold">• Приватный Режим Искушения</div>
            )}
          </div>
        </div>
      </header>

      {/* Main Sandbox Stages router */}
      <main className="flex-1 flex flex-col justify-center px-4">
        {loading && !roomState ? (
          <div className="text-center py-12 animate-pulse" id="loading-spinner">
            <RefreshCw className="w-10 h-10 text-rose-500 animate-spin mx-auto mb-4" />
            <p className="text-sm font-semibold text-rose-300">Синхронизация с сервером...</p>
            <p className="text-xs text-gray-500 mt-1">Ожидайте подключение к Firestore</p>
          </div>
        ) : error ? (
          <div className="w-full max-w-md mx-auto text-center py-12 bg-black/40 border border-gray-800 rounded-2xl p-6" id="error-box">
            <Heart className="w-12 h-12 text-rose-500 mx-auto opacity-30 mb-4" />
            <p className="text-sm font-semibold text-rose-300 mb-2">{error}</p>
            <button 
              onClick={() => setError(null)}
              className="py-2.5 px-6 bg-gradient-to-r from-rose-600 to-purple-600 text-white text-xs font-semibold rounded-xl"
            >
              Вернуться назад
            </button>
          </div>
        ) : !roomCode ? (
          /* STAGE 1: ENTER NICKNAME / ROOM CHOOSE */
          <Lobby onJoin={handleJoinSuccess} />
        ) : roomState?.status === 'waiting' ? (
          /* STAGE 2: HOST WAITING FOR PARTNER */
          <Waiting roomCode={roomCode} onExit={handleLeave} />
        ) : roomState ? (
          /* STAGE 3: ACTIVE PLAY BOARD */
          <GameBoard 
            roomState={roomState}
            messages={messages}
            playerId={playerId!}
            playerNickname={nickname!}
            onLeave={handleLeave}
          />
        ) : (
          /* FALLBACK */
          <Lobby onJoin={handleJoinSuccess} />
        )}
      </main>

      {/* Footer copyright segment */}
      <footer className="text-center py-4 border-t border-rose-500/5 mt-8">
        <p className="text-[10px] text-gray-600 select-none">
          © 2026 Cupid Play – приватные эротические игры для влюбленных пар.
        </p>
      </footer>
    </div>
  );
}
