import React, { useState } from 'react';
import { 
  Flame, 
  Sparkles, 
  HelpCircle, 
  ThumbsUp, 
  ChevronRight, 
  RotateCcw, 
  MessageSquare, 
  User, 
  Award, 
  Heart, 
  Wand2, 
  Settings, 
  RefreshCcw, 
  X,
  Plus,
  Timer
} from 'lucide-react';
import { RoomState, ChatMessage, GameLevel } from '../types';
import { 
  selectChoice, 
  finishTask, 
  pushCustomTask, 
  sendMessage, 
  changeGameLevel, 
  resetRoomGame,
  extendTaskTimer
} from '../firebaseUtils';
import { getRandomTask } from '../questions';
import AnonymChat from './AnonymChat';

interface GameBoardProps {
  roomState: RoomState;
  messages: ChatMessage[];
  playerId: string;
  playerNickname: string;
  onLeave: () => void;
}

export default function GameBoard({ roomState, messages, playerId, playerNickname, onLeave }: GameBoardProps) {
  const [customText, setCustomText] = useState('');
  const [customType, setCustomType] = useState<'truth' | 'dare'>('dare');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isChangingLevel, setIsChangingLevel] = useState(false);
  const [isRolling, setIsRolling] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  const { players, currentTurnId, currentChoice, currentTask, taskStatus, gameLevel, scores, taskTimerEnd } = roomState;

  // Real-time countdown timer sync
  React.useEffect(() => {
    if (!taskTimerEnd) {
      setTimeLeft(null);
      return;
    }

    const updateTimer = () => {
      const diff = Math.max(0, Math.floor((taskTimerEnd - Date.now()) / 1000));
      setTimeLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 500);

    return () => clearInterval(interval);
  }, [taskTimerEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleExtendTimer = async () => {
    try {
      await extendTaskTimer(roomState.id, taskTimerEnd);
    } catch (err) {
      console.error('Error extending timer:', err);
    }
  };

  // Identify players
  const myPlayer = players.find(p => p.id === playerId);
  const partnerPlayer = players.find(p => p.id !== playerId);
  
  const isMyTurn = currentTurnId === playerId;
  const currentTurnPlayerName = isMyTurn 
    ? 'ТВОЙ ХОД! 🔥' 
    : `ХОД ПАРТНЕРА – ${partnerPlayer?.name || 'Ожидание...'}`;

  // Select a standard random task
  const handleSelectChoice = async (type: 'truth' | 'dare') => {
    if (!isMyTurn) return;
    
    setIsRolling(true);
    // Simulate interactive spinning wheel
    setTimeout(async () => {
      const taskText = getRandomTask(type, gameLevel);
      try {
        await selectChoice(roomState.id, playerId, type, taskText);
        // Log selection standardly
        const selectedLabel = type === 'truth' ? 'ПРАВДУ 💭' : 'ДЕЙСТВИЕ 🔞';
        await sendMessage(
          roomState.id, 
          'system', 
          'Искушение', 
          `😏 Игрок *${playerNickname}* выбрал(а) ${selectedLabel}!`, 
          true
        );
      } catch (err) {
        console.error('Error selecting choice:', err);
      } finally {
        setIsRolling(false);
      }
    }, 850);
  };

  // Complete or drop task
  const handleFinishTask = async (success: boolean) => {
    try {
      await finishTask(
        roomState.id, 
        playerId, 
        playerNickname,
        success, 
        scores, 
        players
      );
    } catch (err) {
      console.error('Error completing task:', err);
    }
  };

  // Submit custom task to partner
  const handleSendCustomTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTask = customText.trim();
    if (!cleanTask) return;

    try {
      await pushCustomTask(roomState.id, customType, cleanTask);
      setCustomText('');
      setShowCustomModal(false);
    } catch (err) {
      console.error('Error pushing custom task:', err);
    }
  };

  // Handle Game Level Change
  const handleChangeLevel = async (level: GameLevel) => {
    setIsChangingLevel(true);
    try {
      await changeGameLevel(roomState.id, level);
    } catch (err) {
      console.error('Error changing level:', err);
    } finally {
      setIsChangingLevel(false);
    }
  };

  // Reset Game State safely
  const handleResetGame = async () => {
    if (window.confirm('Сбросить текущий ход и вернуться к выбору ПРАВДЫ или ДЕЙСТВИЯ?')) {
      try {
        await resetRoomGame(roomState.id);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-2 font-sans" id="gameboard-container">
      
      {/* SECTION 1: BENTO GRID HEADLINE & METRICS CARD */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 mb-6">
        
        {/* Joint Bond Score & Liaison Header Box */}
        <div className="md:col-span-8 bento-box p-6 bg-neutral-900/50 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-center gap-3">
            <Heart className="w-5 h-5 text-rose-600 fill-rose-600 pulse-heart" />
            <div>
              <span className="text-[9px] uppercase tracking-[0.25em] text-rose-500 font-bold block mb-0.5">Приватный сеанс</span>
              <h2 className="text-xl md:text-2xl font-light font-display text-neutral-100 flex items-center gap-3">
                Храм Искушения 
                <span className="text-xs bg-neutral-950 border border-neutral-800 text-rose-450 px-3 py-1 rounded-full font-mono uppercase tracking-widest font-semibold">
                  {roomState.id}
                </span>
              </h2>
            </div>
          </div>
          
          <div className="border-t border-neutral-800/80 mt-6 pt-4 flex flex-wrap items-center justify-between gap-4">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 bg-rose-600 rounded-full"></div>
                <span className="text-xs text-neutral-400 font-medium">{playerNickname}:</span>
                <span className="font-bold text-neutral-100 text-sm font-sans">{scores[playerId] || 0}</span>
              </div>
              {partnerPlayer && (
                <div className="flex items-center gap-2 border-l border-neutral-800 pl-6">
                  <div className="w-2.5 h-2.5 bg-neutral-600 rounded-full"></div>
                  <span className="text-xs text-neutral-400 font-medium">{partnerPlayer.name}:</span>
                  <span className="font-bold text-neutral-100 text-sm font-sans">{scores[partnerPlayer.id] || 0}</span>
                </div>
              )}
            </div>
            
            <div className="text-[10px] text-neutral-500 tracking-wider uppercase font-semibold">
              • Канал близости защищен сквозным шифрованием
            </div>
          </div>
        </div>

        {/* Level Indicator & Reset Box */}
        <div className="md:col-span-4 bento-box p-6 bg-neutral-900/50 border border-neutral-800 flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold block mb-1">Режим страсти</span>
              <span className="text-lg font-bold font-sans text-neutral-100 uppercase tracking-widest">
                {gameLevel === 'hot' ? '🌶️ Пикантный' : gameLevel === 'dirty' ? '🔥 Грязный' : '🫦 Экстрим'}
              </span>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-3 bg-neutral-950 hover:bg-neutral-900 rounded-2xl border border-neutral-800 text-neutral-400 transition-all cursor-pointer"
              title="Настройки"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setShowCustomModal(true)}
              className="text-[10px] uppercase tracking-widest font-bold text-purple-400 hover:text-purple-300 py-2 px-3 bg-purple-950/20 border border-purple-900/40 rounded-xl transition-all cursor-pointer"
            >
              + Свое задание
            </button>
            <button
              onClick={onLeave}
              className="text-[10px] uppercase tracking-widest font-bold text-neutral-500 hover:text-rose-500 cursor-pointer transition-all"
            >
              Выйти
            </button>
          </div>
        </div>

      </div>

      {/* Settings Panel layout inside Bento Structure */}
      {showSettings && (
        <div className="mb-6 animate-fade-in bento-box p-6 bg-neutral-950 border border-rose-950/40 relative">
          <button 
            onClick={() => setShowSettings(false)}
            className="absolute top-4 right-4 text-neutral-500 hover:text-neutral-300 p-1"
          >
            <X className="w-4 h-4" />
          </button>
          
          <h3 className="text-xs font-bold text-neutral-300 uppercase tracking-widest mb-4">Настройки близости</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={() => handleChangeLevel('hot')}
              disabled={isChangingLevel}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                gameLevel === 'hot' 
                  ? 'bg-rose-950/20 border-rose-600 text-rose-300' 
                  : 'bg-neutral-900/30 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <h4 className="text-xs font-bold text-rose-400 mb-1 font-sans uppercase tracking-wider">🌶️ Пикантно (Горячо)</h4>
              <p className="text-[10px] text-neutral-500 leading-relaxed">Нежные прикосновения, чувственный флирт, легкий массаж и волнительные беседы.</p>
            </button>

            <button
              onClick={() => handleChangeLevel('dirty')}
              disabled={isChangingLevel}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                gameLevel === 'dirty' 
                  ? 'bg-rose-950/30 border-rose-500 text-rose-200' 
                  : 'bg-neutral-900/30 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <h4 className="text-xs font-bold text-rose-400 mb-1 font-sans uppercase tracking-wider">🔥 Грязно (Пошло)</h4>
              <p className="text-[10px] text-neutral-500 leading-relaxed">Обольстительные укусы, ласки эрогенных зон, ролевые провокации и откровенная правда.</p>
            </button>

            <button
              onClick={() => handleChangeLevel('extreme')}
              disabled={isChangingLevel}
              className={`p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                gameLevel === 'extreme' 
                  ? 'bg-rose-950/45 border-red-600 text-white font-semibold' 
                  : 'bg-neutral-900/30 border-neutral-800 text-neutral-400 hover:border-neutral-700'
              }`}
            >
              <h4 className="text-xs font-bold text-rose-300 mb-1 font-sans uppercase tracking-wider">🫦 Экстрим (Максимум Табу)</h4>
              <p className="text-[10px] text-neutral-500 leading-relaxed">Игры в темноте, легкое связывание, глубокая стимуляция и осуществление фантазий.</p>
            </button>
          </div>

          <div className="border-t border-neutral-800/85 mt-5 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
            <button
              onClick={handleResetGame}
              className="text-[11px] font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/30 py-2 px-4 rounded-full transition-all"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Сбросить зависший ход
            </button>
            <span className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold font-mono">
              Синхронизация по WebSocket в реальном времени
            </span>
          </div>
        </div>
      )}

      {/* SECTION 2: BENTO MAIN WORKSPACE CELL (ACTIVE GAME PLAY VS REALTIME CHAT) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT COMPARTMENT: BENTO ACTIVE GAME CARD */}
        <div className="lg:col-span-7 flex flex-col justify-between bento-box p-8 bg-neutral-900/60 border border-neutral-800 relative min-h-[480px]">
          
          {/* Subtle background context glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-rose-950/4 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-950/4 rounded-full blur-3xl pointer-events-none" />

          {/* Turn status header */}
          <div className="flex items-center justify-between mb-6 bg-neutral-950 border border-neutral-800 rounded-2xl px-4 py-3 select-none">
            <div className="flex items-center gap-2.5">
              <span className={`w-2.5 h-2.5 rounded-full ${isMyTurn ? 'bg-rose-600 animate-pulse' : 'bg-neutral-700'}`} />
              <span className={`text-[11px] font-bold uppercase tracking-widest ${isMyTurn ? 'text-rose-400' : 'text-neutral-500'}`}>
                {currentTurnPlayerName}
              </span>
            </div>
            
            <span className="text-[9px] uppercase tracking-wider bg-rose-950/20 border border-rose-900/30 px-3 py-1 rounded-full text-rose-400 font-semibold font-mono">
              {gameLevel === 'hot' ? '🌶️ Флирт' : gameLevel === 'dirty' ? '🔥 Грязно' : '🫦 Табу'}
            </span>
          </div>

          {/* DYNAMIC WORKSPACE BODY */}
          <div className="flex-1 flex flex-col justify-center items-center py-6 w-full">
            {isRolling ? (
              <div className="text-center animate-pulse">
                <RefreshCcw className="w-10 h-10 text-rose-500 animate-spin mx-auto mb-4" />
                <p className="text-sm font-semibold text-rose-300">Перемешиваем интимную колоду...</p>
                <p className="text-xs text-neutral-500 mt-1">Ожидайте, рождается нечто потрясающее...</p>
              </div>
            ) : !currentChoice ? (
              /* PANEL A: CHOICE SELECTION GRID */
              <div className="w-full text-center max-w-lg mx-auto">
                {isMyTurn ? (
                  <div className="animate-fade-in">
                    <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 font-bold block mb-1">Ваша очередь удивлять</span>
                    <h3 className="text-xl md:text-2xl font-display font-light text-neutral-100 mb-6 leading-relaxed italic">
                      Перед партнером нет тайн. Какой путь вы укажете пламени?
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* TRUTH CHOOSE */}
                      <button
                        onClick={() => handleSelectChoice('truth')}
                        className="p-6 bg-neutral-950/80 border border-neutral-800 hover:border-purple-900/80 hover:bg-neutral-950 rounded-3xl text-left cursor-pointer transition-all duration-300 group relative overflow-hidden"
                      >
                        <div className="absolute top-4 right-4 p-2 bg-purple-950/20 rounded-xl border border-purple-900/30 text-purple-400">
                          <HelpCircle className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold block mb-2">Откровения</span>
                        <h4 className="text-sm font-bold text-purple-300 group-hover:text-purple-200">ПРАВДА 💬</h4>
                        <p className="text-[11px] text-neutral-400 mt-2.5 leading-relaxed font-sans font-light">
                          Ответьте абсолютно честно на пикантный интимный вопрос партнера.
                        </p>
                      </button>

                      {/* DARE CHOOSE */}
                      <button
                        onClick={() => handleSelectChoice('dare')}
                        className="p-6 bg-neutral-950/80 border border-neutral-800 hover:border-rose-900/80 hover:bg-neutral-950 rounded-3xl text-left cursor-pointer transition-all duration-300 group relative overflow-hidden"
                      >
                        <div className="absolute top-4 right-4 p-2 bg-rose-950/20 rounded-xl border border-rose-900/30 text-rose-400">
                          <Flame className="w-4 h-4" />
                        </div>
                        <span className="text-[9px] uppercase tracking-[0.2em] text-neutral-500 font-bold block mb-2">Телесный опыт</span>
                        <h4 className="text-sm font-bold text-rose-350 group-hover:text-rose-200 font-sans">ДЕЙСТВИЕ 🔞</h4>
                        <p className="text-[11px] text-neutral-400 mt-2.5 leading-relaxed font-sans font-light">
                          Сделайте страстный вызов партнеру, перейдите к приятному контакту.
                        </p>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* GUEST SCREEN WITH DETAILED INFO */
                  <div className="text-center py-8">
                    <div className="relative inline-block mb-4">
                      <Heart className="w-12 h-12 text-rose-500/10 fill-rose-500/5 animate-pulse" />
                      <Flame className="w-6 h-6 text-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <h3 className="text-lg font-display text-neutral-200 italic">Связующая нить натянута...</h3>
                    <p className="text-xs text-neutral-500 mt-2.5 max-w-sm mx-auto leading-relaxed">
                      Ваш партнер сейчас выбирает, что вы хотите у него спросить под прицелом страсти. Как только выбор будет сделан — экран обновится самостоятельно.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              /* PANEL B: ACTIVE TASK DISPLAY */
              <div className="w-full max-w-lg mx-auto bg-neutral-950/80 rounded-[2.5rem] border border-neutral-800/80 p-6 md:p-8 shadow-2xl relative animate-fade-in font-sans">
                
                {/* Mode header tag */}
                <div className="flex justify-center mb-6">
                  <span className={`text-[10px] uppercase font-bold tracking-[0.2em] px-4 py-2 rounded-full border ${
                    currentChoice === 'truth' 
                      ? 'bg-purple-950/30 border-purple-900/40 text-purple-300' 
                      : 'bg-rose-950/30 border-rose-900/40 text-rose-300'
                  }`}>
                    {currentChoice === 'truth' ? '💬 ПРАВДА ОТКРОВЕНИЯ' : '🔞 ДЕЙСТВИЕ ИСКУШЕНИЯ'}
                  </span>
                </div>

                {/* Countdown Timer Widget */}
                {timeLeft !== null && (
                  <div className="flex flex-col items-center justify-center -mt-3 mb-6 animate-fade-in">
                    <div className="w-full max-w-[220px] bg-neutral-900/95 rounded-2xl border border-neutral-800/80 p-3.5 flex flex-col items-center relative overflow-hidden shadow-lg">
                      <div className="flex items-center gap-2 text-rose-450 mb-1 z-10">
                        <Timer className={`w-4 h-4 ${timeLeft > 0 && timeLeft < 30 ? 'animate-bounce text-red-500' : 'text-rose-500'}`} />
                        <span className={`font-mono font-black text-lg tracking-widest ${
                          timeLeft === 0 
                            ? 'text-red-500 animate-pulse' 
                            : timeLeft < 30 
                              ? 'text-amber-500 animate-pulse' 
                              : 'text-neutral-100'
                        }`}>
                          {timeLeft === 0 ? '00:00' : formatTime(timeLeft)}
                        </span>
                      </div>
                      
                      {/* Interactive sleek progress bar */}
                      <div className="w-full h-1 bg-neutral-950 rounded-full mt-1.5 overflow-hidden z-10">
                        <div 
                          className={`h-full transition-all duration-1000 rounded-full ${
                            timeLeft === 0 
                              ? 'bg-red-600' 
                              : timeLeft < 30 
                                ? 'bg-amber-550 animate-pulse' 
                                : 'bg-rose-600'
                          }`}
                          style={{ width: `${Math.min(100, Math.max(0, (timeLeft / 120) * 100))}%` }}
                        />
                      </div>

                      {/* Descriptive micro-tag */}
                      <span className="text-[9px] text-neutral-500 uppercase tracking-widest font-bold mt-2 z-10">
                        {timeLeft === 0 ? '⚠️ ВРЕМЯ ИСТЕКЛО!' : 'Время на ход'}
                      </span>

                      {/* Add +1 Minute button */}
                      <button 
                        onClick={handleExtendTimer}
                        className="mt-2.5 flex items-center justify-center gap-1.5 text-[9px] font-bold text-rose-400 hover:text-rose-350 bg-rose-950/25 hover:bg-rose-950/50 border border-rose-900/30 px-3 py-1 rounded-full cursor-pointer transition-all active:scale-95 z-10 select-none uppercase tracking-wider"
                      >
                        <Plus className="w-3 h-3 text-rose-500" />
                        <span>Продлить +1 мин</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Main Task Card */}
                <div className="text-center py-6 min-h-[150px] flex items-center justify-center">
                  <p className="text-base md:text-lg font-display font-medium text-neutral-100 leading-relaxed italic max-w-md">
                    « {currentTask} »
                  </p>
                </div>

                {/* ACTIONS */}
                {isMyTurn ? (
                  <div className="border-t border-neutral-900 pt-6 mt-4">
                    <p className="text-center text-[10px] text-neutral-500 uppercase tracking-wider mb-4 font-bold">
                      Вам необходимо совершить это действие, затем подтвердить результат:
                    </p>
                    <div className="grid grid-cols-2 gap-3.5">
                      
                      <button
                        onClick={() => handleFinishTask(true)}
                        className="py-3 px-4 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider rounded-xl hover:opacity-95 active:scale-95 transition-all text-center cursor-pointer shadow-lg shadow-rose-950/30"
                      >
                        Принято 🔥 +1 балл
                      </button>

                      <button
                        onClick={() => handleFinishTask(false)}
                        className="py-3 px-4 bg-transparent border border-neutral-800 hover:border-neutral-700 text-neutral-400 hover:text-neutral-200 font-bold text-xs uppercase tracking-wider rounded-xl active:scale-95 transition-all text-center cursor-pointer"
                      >
                        Отказываюсь 😳 0
                      </button>

                    </div>
                  </div>
                ) : (
                  /* PARTNER LOADER */
                  <div className="border-t border-neutral-900 pt-4 text-center mt-4">
                    <p className="text-[11px] text-rose-450 flex items-center justify-center gap-2 bg-rose-950/20 py-2.5 px-4 rounded-full border border-rose-900/30">
                      <Sparkles className="w-4 h-4 text-rose-500 animate-spin" />
                      <span>Партнер выполняет это действие сейчас... Наблюдайте или комментируйте в чате!</span>
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bento grid sub bottom tag */}
          <div className="border-t border-neutral-900/60 pt-4 mt-6 flex items-center justify-between text-[10px] text-neutral-500 uppercase tracking-widest font-mono select-none">
            <span>ЛИЧНАЯ СЕССИЯ: {roomState.id}</span>
            <span>ЛЮБОВЬ — ЭТО СВОБОДА И ДОВЕРИЕ</span>
          </div>

        </div>

        {/* RIGHT COMPARTMENT: REAL-TIME ANONYMOUS CHAT BENTO BOX */}
        <div className="lg:col-span-5 flex flex-col">
          <AnonymChat 
            roomCode={roomState.id}
            messages={messages}
            playerId={playerId}
            playerNickname={playerNickname}
          />
        </div>

      </div>

      {/* CUSTOM TASK MODAL RESTYLE */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/90 backdrop-blur-md animate-fade-in" id="custom-task-modal">
          <div className="bento-box p-8 w-full max-w-md relative shadow-2xl border border-neutral-800 bg-neutral-900">
            
            <button 
              onClick={() => setShowCustomModal(false)}
              className="absolute top-5 right-5 text-neutral-500 hover:text-neutral-300 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-950/20 border border-purple-900/30 rounded-xl text-purple-400">
                <Wand2 className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[9px] uppercase tracking-widest text-neutral-500 font-bold block">Индивидуальное испытание</span>
                <h3 className="text-base font-bold text-neutral-100">
                  Сочинить кастомное искушение 🤫
                </h3>
              </div>
            </div>

            <p className="text-xs text-neutral-400 mb-5 leading-relaxed">
              Придумайте задание лично для вашего партнера. Текст мгновенно появится на его экране следующим ходом!
            </p>

            <form onSubmit={handleSendCustomTask} className="space-y-5">
              
              {/* Type selector */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">
                  Категория задания:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomType('truth')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer border text-center transition-all ${
                      customType === 'truth' 
                        ? 'bg-purple-950/40 border-purple-700 text-purple-300' 
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    💭 Правда откровения
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomType('dare')}
                    className={`py-2 px-3 rounded-xl text-xs font-semibold cursor-pointer border text-center transition-all ${
                      customType === 'dare' 
                        ? 'bg-rose-950/40 border-rose-700 text-rose-300' 
                        : 'bg-neutral-900/60 border-neutral-800 text-neutral-500 hover:text-neutral-300'
                    }`}
                  >
                    🔞 Действие тела
                  </button>
                </div>
              </div>

              {/* Text contentarea */}
              <div>
                <label className="block text-[10px] font-bold text-neutral-500 uppercase tracking-widest mb-2.5">
                  Текст задания:
                </label>
                <textarea
                  required
                  maxLength={160}
                  rows={4}
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Пример: Поцелуй меня медленно от шеи до пупка..."
                  className="w-full bg-neutral-950 border border-neutral-800 focus:border-rose-600 rounded-2xl p-4 text-xs text-neutral-100 placeholder-neutral-700 focus:outline-none transition-all font-sans leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={!customText.trim()}
                className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-widest rounded-full shadow-lg shadow-rose-950/30 transition-all cursor-pointer"
              >
                Отправить партнеру! 🔥
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
