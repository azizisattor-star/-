export interface Player {
  id: string;
  name: string;
  role: 'host' | 'guest';
}

export type GameLevel = 'hot' | 'dirty' | 'extreme';

export interface RoomState {
  id: string;
  status: 'waiting' | 'playing' | 'ended';
  players: Player[];
  currentTurnId: string;
  currentChoice: 'truth' | 'dare' | null;
  currentTask: string | null;
  taskStatus: 'pending' | 'completed' | 'surrendered' | null;
  gameLevel: GameLevel;
  scores: Record<string, number>;
  taskTimerEnd?: number | null;
  createdAt: number;
  lastActive: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}
