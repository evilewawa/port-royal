import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import type { GameState, ClientAction, GameConfig } from '../types';
import { mockGameState, MOCK_PLAYER_ID } from '../mockState';

interface SocketContextValue {
  socket: Socket | null;
  connected: boolean;
  gameState: GameState | null;
  playerId: string | null;
  error: string | null;
  createGame: (playerName: string) => void;
  joinGame: (gameId: string, playerName: string) => void;
  startGame: (config?: Partial<GameConfig>) => void;
  sendAction: (action: ClientAction) => void;
  loadMock: () => void;
}

const SocketContext = createContext<SocketContextValue | null>(null);

const SERVER_URL = import.meta.env.VITE_SERVER_URL ?? 'http://localhost:3001';

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const socketRef = useRef<Socket | null>(null);
  const [connected, setConnected] = useState(false);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerId, setPlayerId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const socket = io(SERVER_URL, { autoConnect: true });
    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setPlayerId(socket.id ?? null);
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('game:state', (state: GameState) => {
      setGameState(state);
      setError(null);
    });

    socket.on('game:error', (msg: string) => {
      setError(msg);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const createGame = (playerName: string) => {
    socketRef.current?.emit('game:create', { playerName });
  };

  const joinGame = (gameId: string, playerName: string) => {
    socketRef.current?.emit('game:join', { gameId, playerName });
  };

  const startGame = (config?: Partial<GameConfig>) => {
    socketRef.current?.emit('game:start', config);
  };

  const sendAction = (action: ClientAction) => {
    socketRef.current?.emit('game:action', action);
  };

  const loadMock = () => {
    setGameState(mockGameState);
    setPlayerId(MOCK_PLAYER_ID);
  };

  return (
    <SocketContext.Provider value={{ socket: socketRef.current, connected, gameState, playerId, error, createGame, joinGame, startGame, sendAction, loadMock }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}
