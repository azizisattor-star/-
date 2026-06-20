import React, { useState } from 'react';
import { Heart, Flame, Info, AlertOctagon, Smartphone, Download } from 'lucide-react';
import { GameLevel } from '../types';
import { createRoom, joinRoom } from '../firebaseUtils';

interface LobbyProps {
  onJoin: (roomCode: string, playerId: string, nickname: string) => void;
}

export default function Lobby({ onJoin }: LobbyProps) {
  const [nickname, setNickname] = useState('');
  const [roomCodeInput, setRoomCodeInput] = useState('');
  const [level, setLevel] = useState<GameLevel>('dirty');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmedName = nickname.trim();
    if (!trimmedName) {
      setError('Пожалуйста, введите ваше имя (псевдоним) для начала игры.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const { roomCode, playerId } = await createRoom(trimmedName, level);
      onJoin(roomCode, playerId, trimmedName);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ошибка создания комнаты. Пожалуйста, попробуйте еще раз.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    const trimmedName = nickname.trim();
    if (!trimmedName) {
      setError('Пожалуйста, введите ваше имя (псевдоним) перед тем, как войти.');
      return;
    }
    
    const trimmedCode = roomCodeInput.trim().toUpperCase();
    if (!trimmedCode) {
      setError('Пожалуйста, введите 4-значный код комнаты вашего партнера.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const { playerId } = await joinRoom(trimmedCode, trimmedName);
      onJoin(trimmedCode, playerId, trimmedName);
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Ошибка входа в комнату. Проверьте правильность кода.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto pt-4 pb-12" id="lobby-container">
      {/* Intimate Brand Greeting Card */}
      <div className="text-center mb-8">
        <div className="flex justify-center items-center gap-2 mb-2">
          <Heart className="w-5 h-5 text-rose-600 fill-rose-600 pulse-heart" />
          <span className="font-sans text-xs uppercase tracking-[0.3em] text-rose-500 font-bold">Клуб Купидона</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-display font-black text-gray-100 tracking-tight">
          Искушение
        </h1>
        <p className="text-[10px] tracking-[0.2em] text-neutral-400 uppercase font-semibold mt-1">
          Правда или Действие • Секретные связи
        </p>
      </div>

      <div className="bento-box p-8 relative overflow-hidden bg-neutral-900/60 border border-neutral-800">
        {/* Subtle background overlay gradient */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-rose-900/5 rounded-full blur-3xl pointer-events-none" />

        {error && (
          <div className="bg-rose-950/40 border border-rose-900/50 text-rose-200 text-xs rounded-2xl p-4 mb-5 flex items-start gap-2.5">
            <AlertOctagon className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: Nickname input */}
        <div className="mb-6">
          <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-widest mb-2.5" htmlFor="nickname-input">
            Ваш интимный псевдоним 🤫
          </label>
          <input
            id="nickname-input"
            type="text"
            maxLength={18}
            placeholder="Кошечка, Любимый, Господин..."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            className="w-full bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3.5 text-sm text-neutral-100 placeholder-neutral-600 focus:outline-none focus:border-rose-600 focus:ring-1 focus:ring-rose-600/30 transition-all font-sans"
          />
        </div>

        <div className="border-t border-neutral-800/80 my-2" />

        {/* TWO TABS: Create Card or Join Card */}
        <div className="grid grid-cols-1 gap-6 mt-4">
          
          {/* CREATE AN INTIMATE ROOM SECTION */}
          <div className="bg-neutral-950/40 rounded-3xl p-5 border border-neutral-800/60 hover:border-rose-950/40 transition-all">
            <h2 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-3 uppercase tracking-wider">
              <Flame className="w-4 h-4 text-rose-500" />
              1. Начать новое искушение
            </h2>
            
            {/* Level selection */}
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-2.5">Уровень пошлости:</p>
            <div className="grid grid-cols-3 gap-2 mb-4">
              <button
                type="button"
                onClick={() => setLevel('hot')}
                className={`py-2 px-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                  level === 'hot'
                    ? 'bg-rose-950/40 border-rose-700 text-rose-300 font-semibold shadow-md'
                    : 'bg-neutral-900/40 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                }`}
              >
                🌶️ Пикантно
              </button>
              <button
                type="button"
                onClick={() => setLevel('dirty')}
                className={`py-2 px-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                  level === 'dirty'
                    ? 'bg-rose-950/50 border-rose-600 text-rose-200 font-semibold shadow-lg shadow-rose-950/30'
                    : 'bg-neutral-900/40 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                }`}
              >
                🔥 Грязно
              </button>
              <button
                type="button"
                onClick={() => setLevel('extreme')}
                className={`py-2 px-1.5 rounded-xl text-xs font-medium cursor-pointer transition-all border ${
                  level === 'extreme'
                    ? 'bg-rose-900/40 border-red-600 text-white font-semibold shadow-md'
                    : 'bg-neutral-900/40 border-neutral-800 text-neutral-500 hover:text-neutral-300 hover:border-neutral-700'
                }`}
              >
                🫦 Экстрим
              </button>
            </div>

            <button
              id="btn-create-room"
              onClick={handleCreate}
              disabled={isLoading}
              className="w-full bg-rose-600 hover:bg-rose-700 font-bold text-xs uppercase tracking-widest py-3.5 rounded-full hover:opacity-95 active:scale-98 transition-all duration-300 text-white cursor-pointer shadow-lg shadow-rose-950/40"
            >
              {isLoading ? 'Генерация...' : 'Создать приватную комнату'}
            </button>
          </div>

          <div className="flex items-center justify-center my-1 select-none">
            <span className="h-[1px] w-full bg-neutral-800/80"></span>
            <span className="text-[10px] text-neutral-500 px-3 uppercase font-bold tracking-widest">ИЛИ</span>
            <span className="h-[1px] w-full bg-neutral-800/80"></span>
          </div>

          {/* JOIN EXISTING ROOM SECTION */}
          <div className="bg-neutral-950/40 rounded-3xl p-5 border border-neutral-800/60 hover:border-rose-950/40 transition-all">
            <h2 className="text-xs font-bold text-rose-400 flex items-center gap-1.5 mb-3 uppercase tracking-wider">
              🔓 2. Войти к партнеру
            </h2>
            
            <p className="text-[10px] text-neutral-500 uppercase tracking-wider font-semibold mb-2.5">Запросите 4-значный код комнаты:</p>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={4}
                placeholder="КОД"
                value={roomCodeInput}
                onChange={(e) => setRoomCodeInput(e.target.value)}
                className="w-24 text-center tracking-widest text-lg font-bold bg-neutral-950 border border-neutral-800 rounded-2xl px-3 py-2 text-rose-500 placeholder-neutral-700 focus:outline-none focus:border-rose-600 uppercase font-sans"
              />
              <button
                id="btn-join-room"
                onClick={handleJoin}
                disabled={isLoading}
                className="flex-1 bg-neutral-100 hover:bg-white text-black font-bold text-xs uppercase tracking-widest py-2.5 px-4 rounded-full active:scale-98 transition-all cursor-pointer"
              >
                {isLoading ? 'Связь...' : 'Присоединиться'}
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* PWA Download Banner */}
      <div className="mt-6 bg-neutral-900/45 border border-rose-950/30 rounded-[2rem] p-5 shadow-xl">
        <h3 className="text-xs font-bold text-rose-400 flex items-center gap-2 mb-3 uppercase tracking-wider font-sans">
          <Smartphone className="w-4 h-4 text-rose-500 animate-pulse shrink-0" />
          Установить как приложение на телефон
        </h3>
        <p className="text-[11px] text-neutral-400 mb-4 leading-relaxed font-sans">
          Эту игру можно скачать прямо на главный экран вашего <b>iPhone</b> или <b>Android</b>. Она добавится на рабочий стол с красивой иконкой и будет работать как полноценное приложение во весь экран!
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-[10px] text-neutral-300">
          <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800/60 flex flex-col justify-between">
            <div>
              <span className="font-bold text-rose-400 block mb-1.5 uppercase tracking-wide font-sans">🍏 Для iPhone (Safari)</span>
              <ol className="list-decimal pl-4.5 space-y-1.5 text-neutral-400 font-sans leading-relaxed">
                <li>Откройте этот сайт именно в браузере <b>Safari</b></li>
                <li>Нажмите кнопку <b>«Поделиться»</b> (квадрат со стрелочкой вверх на панели)</li>
                <li>Прокрутите список и нажмите <b>«На экран „Домой“»</b></li>
                <li>Назовите его «Искушение» и нажмите <b>«Добавить»</b> вверху справа!</li>
              </ol>
            </div>
          </div>
          <div className="bg-neutral-950/60 p-4 rounded-2xl border border-neutral-800/60 flex flex-col justify-between">
            <div>
              <span className="font-bold text-rose-400 block mb-1.5 uppercase tracking-wide font-sans">🤖 Для Android (Chrome)</span>
              <ol className="list-decimal pl-4.5 space-y-1.5 text-neutral-400 font-sans leading-relaxed">
                <li>Откройте этот сайт в веб-браузере <b>Google Chrome</b></li>
                <li>Нажмите на <b>три точки</b> (меню) в правом верхнем углу</li>
                <li>Выберите пункт <b>«Добавить на гл. экран»</b> (или <b>«Установить приложение»</b>)</li>
                <li>Нажмите <b>«Установить»</b> во всплывающем окне!</li>
              </ol>
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice block */}
      <div className="mt-4 flex gap-3 p-4 bg-neutral-900/30 border border-neutral-800/80 rounded-[2rem] text-[10px] text-neutral-400 leading-relaxed">
        <Info className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
        <p>
          Это уединенное пространство для вашей пары. Все ходы и сообщения синхронизируются мгновенно. Будьте откровенны, делитесь сокровенным и не забывайте: границы и комфорт обоих партнеров превыше всего.
        </p>
      </div>
    </div>
  );
}
