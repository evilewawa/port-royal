import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { GameRoom } from './game/GameRoom';
import type { ClientAction } from './types';

const app = express();
app.get('/health', (_req, res) => res.send('ok'));
const httpServer = createServer(app);

const ALLOWED_ORIGIN = process.env.CLIENT_ORIGIN ?? 'http://localhost:5173';

const io = new Server(httpServer, {
  cors: { origin: ALLOWED_ORIGIN, methods: ['GET', 'POST'] },
});

// Map of gameId → GameRoom
const rooms = new Map<string, GameRoom>();
// Map of socketId → gameId (so we can clean up on disconnect)
const socketToGame = new Map<string, string>();

function broadcastRoom(room: GameRoom) {
  io.to(room.id).emit('game:state', room.toClientState());
}

io.on('connection', socket => {
  console.log(`[+] ${socket.id} connected`);

  // ── Create game ────────────────────────────────────────────────────────────
  socket.on('game:create', ({ playerName }: { playerName: string }) => {
    try {
      const gameId = uuidv4().slice(0, 8).toUpperCase();
      const room = new GameRoom(gameId);
      room.addPlayer(socket.id, playerName);
      rooms.set(gameId, room);
      socketToGame.set(socket.id, gameId);
      socket.join(gameId);
      console.log(`[game] ${playerName} created game ${gameId}`);
      broadcastRoom(room);
    } catch (err: any) {
      socket.emit('game:error', err.message);
    }
  });

  // ── Join game ──────────────────────────────────────────────────────────────
  socket.on('game:join', ({ gameId, playerName }: { gameId: string; playerName: string }) => {
    try {
      const room = rooms.get(gameId);
      if (!room) throw new Error(`Game ${gameId} not found`);
      room.addPlayer(socket.id, playerName);
      socketToGame.set(socket.id, gameId);
      socket.join(gameId);
      console.log(`[game] ${playerName} joined game ${gameId}`);
      broadcastRoom(room);
    } catch (err: any) {
      socket.emit('game:error', err.message);
    }
  });

  // ── Start game ─────────────────────────────────────────────────────────────
  socket.on('game:start', () => {
    try {
      const gameId = socketToGame.get(socket.id);
      if (!gameId) throw new Error('Not in a game');
      const room = rooms.get(gameId);
      if (!room) throw new Error('Game not found');
      room.startGame();
      console.log(`[game] Game ${gameId} started`);
      broadcastRoom(room);
    } catch (err: any) {
      socket.emit('game:error', err.message);
    }
  });

  // ── Player action ──────────────────────────────────────────────────────────
  socket.on('game:action', (action: ClientAction) => {
    try {
      const gameId = socketToGame.get(socket.id);
      if (!gameId) throw new Error('Not in a game');
      const room = rooms.get(gameId);
      if (!room) throw new Error('Game not found');
      room.handleAction(socket.id, action);
      broadcastRoom(room);
    } catch (err: any) {
      socket.emit('game:error', err.message);
    }
  });

  // ── Disconnect ─────────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    console.log(`[-] ${socket.id} disconnected`);
    const gameId = socketToGame.get(socket.id);
    if (gameId) {
      socketToGame.delete(socket.id);
      const room = rooms.get(gameId);
      if (room) {
        room.removePlayer(socket.id);
        if (room.isEmpty()) {
          rooms.delete(gameId);
          console.log(`[game] Game ${gameId} removed (empty)`);
        } else {
          broadcastRoom(room);
        }
      }
    }
  });
});

const PORT = parseInt(process.env.PORT ?? '3001', 10);
httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});
