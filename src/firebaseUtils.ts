import { db } from './firebase';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  onSnapshot, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit,
  serverTimestamp,
  arrayUnion,
  arrayRemove
} from 'firebase/firestore';
import { RoomState, ChatMessage, Player, GameLevel } from './types';

// Generate a random room ID (e.g. 4 capital letters/numbers)
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing chars like O, 0, I, 1
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Generate a random human-friendly ID for players
export function generateUUID(): string {
  return 'p_' + Math.random().toString(36).substring(2, 11);
}

// Create a new synced Game Room
export async function createRoom(hostName: string, level: GameLevel): Promise<{ roomCode: string; playerId: string }> {
  // Try up to 5 times to get a unique code
  let roomCode = generateRoomCode();
  let roomDocRef = doc(db, 'rooms', roomCode);
  let attempts = 0;
  
  while (attempts < 5) {
    const existing = await getDoc(roomDocRef);
    if (!existing.exists()) {
      break;
    }
    roomCode = generateRoomCode();
    roomDocRef = doc(db, 'rooms', roomCode);
    attempts++;
  }

  const hostId = generateUUID();
  const cleanName = hostName.trim() || 'Хозяин';
  
  const initialRoom: RoomState = {
    id: roomCode,
    status: 'waiting',
    players: [
      { id: hostId, name: cleanName, role: 'host' }
    ],
    currentTurnId: hostId,
    currentChoice: null,
    currentTask: null,
    taskStatus: null,
    gameLevel: level,
    scores: {
      [hostId]: 0
    },
    createdAt: Date.now(),
    lastActive: Date.now()
  };

  await setDoc(roomDocRef, initialRoom);

  // Send a system welcome message
  await sendMessage(roomCode, 'system', 'Искушение', `❤️ Комната создана! Игрок ${cleanName} готов к игре. Поделитесь кодом: ${roomCode}`, true);

  return { roomCode, playerId: hostId };
}

// Join an existing Game Room
export async function joinRoom(roomCode: string, name: string): Promise<{ playerId: string }> {
  const cleanCode = roomCode.toUpperCase().trim();
  const roomDocRef = doc(db, 'rooms', cleanCode);
  const roomSnap = await getDoc(roomDocRef);

  if (!roomSnap.exists()) {
    throw new Error('Комната с таким кодом не найдена.');
  }

  const roomData = roomSnap.data() as RoomState;
  
  if (roomData.status === 'ended') {
    throw new Error('Эта игра уже завершена.');
  }

  if (roomData.players.length >= 2) {
    // Check if we are reconnecting or if the room is indeed full.
    // To keep it simple, we allow reconnecting but block 3rd players.
    throw new Error('В комнате уже играют двое игроков. Игра рассчитана строго на двоих.');
  }

  const guestId = generateUUID();
  const cleanName = name.trim() || 'Гость';
  
  const updatedPlayers: Player[] = [
    ...roomData.players,
    { id: guestId, name: cleanName, role: 'guest' }
  ];

  const updatedScores = {
    ...roomData.scores,
    [guestId]: 0
  };

  await updateDoc(roomDocRef, {
    players: updatedPlayers,
    scores: updatedScores,
    status: 'playing', // Auto-start the game when the second player joins
    lastActive: Date.now()
  });

  // Send system message
  await sendMessage(cleanCode, 'system', 'Искушение', `🔥 Игрок ${cleanName} присоединился! Игра началась!`, true);

  return { playerId: guestId };
}

// Change Game Intensity Level
export async function changeGameLevel(roomCode: string, newLevel: GameLevel): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomCode);
  await updateDoc(roomDocRef, {
    gameLevel: newLevel,
    lastActive: Date.now()
  });
  
  const levelNames = {
    hot: '🌶️ Пикантно',
    dirty: '🔥 Пошло и грязно',
    extreme: '🫦 Экстрим'
  };
  
  await sendMessage(roomCode, 'system', 'Искушение', `⚙️ Уровень горячести изменен на: ${levelNames[newLevel]}`, true);
}

// Submit a choice (Truth or Dare)
export async function selectChoice(roomCode: string, playerId: string, type: 'truth' | 'dare', taskText: string): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomCode);
  
  await updateDoc(roomDocRef, {
    currentChoice: type,
    currentTask: taskText,
    taskStatus: 'pending',
    taskTimerEnd: Date.now() + 120000, // 2 minutes countdown
    lastActive: Date.now()
  });
}

// Complete the task (Award points and pass the turn)
export async function finishTask(
  roomCode: string, 
  playerId: string, 
  playerNickname: string,
  success: boolean, 
  currentScores: Record<string, number>,
  allPlayers: Player[]
): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomCode);
  
  // Advance scores if successful
  const updatedScores = { ...currentScores };
  if (success) {
    updatedScores[playerId] = (updatedScores[playerId] || 0) + 1;
  }

  // Find the next player to switch turn to
  const partnerPlayer = allPlayers.find(p => p.id !== playerId);
  const nextTurnId = partnerPlayer ? partnerPlayer.id : playerId;

  await updateDoc(roomDocRef, {
    taskStatus: success ? 'completed' : 'surrendered',
    scores: updatedScores,
    currentTurnId: nextTurnId,
    currentChoice: null,
    currentTask: null,
    taskTimerEnd: null, // Clear timer
    lastActive: Date.now()
  });

  // Log in system messages
  const statusEmoji = success ? '🎉' : '😳';
  const statusText = success 
    ? `выполнил(а) задание и получает +1 балл!` 
    : `струсил(а) и сдался(лась)! Очки не начислены.`;
    
  await sendMessage(
    roomCode, 
    'system', 
    'Искушение', 
    `${statusEmoji} Игрок *${playerNickname}* ${statusText}`, 
    true
  );
}

// Custom tasks pushed directly by a partner
export async function pushCustomTask(roomCode: string, type: 'truth' | 'dare', text: string): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomCode);
  await updateDoc(roomDocRef, {
    currentChoice: type,
    currentTask: text,
    taskStatus: 'pending',
    taskTimerEnd: Date.now() + 120000, // 2 minutes countdown
    lastActive: Date.now()
  });
  
  const typeText = type === 'truth' ? 'кастомную Правду' : 'кастомное Действие';
  await sendMessage(roomCode, 'system', 'Искушение', `🤫 Партнер отправил вам ${typeText}! Вы обязаны ответить!`, true);
}

// Extend the countdown timer by 60 seconds (for extra fun)
export async function extendTaskTimer(roomCode: string, currentTimerEnd: number | null | undefined): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomCode);
  const baseValue = currentTimerEnd && currentTimerEnd > Date.now() ? currentTimerEnd : Date.now();
  const newTimerEnd = baseValue + 60000;
  
  await updateDoc(roomDocRef, {
    taskTimerEnd: newTimerEnd,
    lastActive: Date.now()
  });
  
  await sendMessage(roomCode, 'system', 'Искушение', `⏳ Время на выполнение задания продлено на +60 сек! Поспешите!`, true);
}

// Post a message to the Anonymous Chat
export async function sendMessage(
  roomCode: string, 
  senderId: string, 
  senderName: string, 
  text: string, 
  isSystem: boolean = false
): Promise<void> {
  if (!text.trim() && !isSystem) return;
  const messagesCollectionRef = collection(db, 'rooms', roomCode, 'messages');
  
  await addDoc(messagesCollectionRef, {
    senderId,
    senderName,
    text: text.trim(),
    timestamp: Date.now(),
    isSystem
  });
}

// Real-time synchronization subscription for Room State
export function subscribeToRoom(roomCode: string, onUpdate: (room: RoomState | null) => void) {
  const roomDocRef = doc(db, 'rooms', roomCode.toUpperCase());
  return onSnapshot(roomDocRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as RoomState);
    } else {
      onUpdate(null);
    }
  }, (err) => {
    console.error('Room subscription error:', err);
  });
}

// Real-time synchronization subscription for Messages
export function subscribeToMessages(roomCode: string, onUpdate: (messages: ChatMessage[]) => void) {
  const messagesCollectionRef = collection(db, 'rooms', roomCode.toUpperCase(), 'messages');
  const q = query(messagesCollectionRef, orderBy('timestamp', 'asc'), limit(100));
  
  return onSnapshot(q, (querySnap) => {
    const list: ChatMessage[] = [];
    querySnap.forEach((doc) => {
      list.push({ id: doc.id, ...doc.data() } as ChatMessage);
    });
    onUpdate(list);
  }, (err) => {
    console.error('Messages subscription error:', err);
  });
}

// Reset Game / Clear Task
export async function resetRoomGame(roomCode: string): Promise<void> {
  const roomDocRef = doc(db, 'rooms', roomCode);
  await updateDoc(roomDocRef, {
    currentChoice: null,
    currentTask: null,
    taskStatus: null,
    taskTimerEnd: null,
    lastActive: Date.now()
  });
  await sendMessage(roomCode, 'system', 'Искушение', `🔄 Раунд сброшен заново!`, true);
}
