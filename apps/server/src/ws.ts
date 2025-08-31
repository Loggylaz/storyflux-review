import { Server } from 'socket.io';
import { prisma } from '@storyflux/db/src/client.js';

type PlayerState = { name: string; ready: boolean; lastAction?: string };
type RoomState = { players: Map<string, PlayerState> };

const rooms = new Map<string, RoomState>();

export function setupWs(io: Server) {
  io.on('connection', (socket) => {
    socket.on('joinRoom', ({ roomId, userId, displayName }: { roomId: string; userId: string; displayName: string; }) => {
      socket.join(roomId);
      let state = rooms.get(roomId);
      if (!state) {
        state = { players: new Map() };
        rooms.set(roomId, state);
      }
      state.players.set(userId, { name: displayName, ready: false });
      broadcastWaiting(io, roomId, state);
    });

    socket.on('playerAction', async ({ roomId, userId, action }: { roomId: string; userId: string; action: string }) => {
      const state = rooms.get(roomId);
      if (!state) return;
      const p = state.players.get(userId);
      if (!p) return;
      p.ready = true;
      p.lastAction = action;

      if ([...state.players.values()].every((v) => v.ready)) {
        // Ici, ordre simple (ordre d'arrivée). Semaine 2: UI drag&drop.
        const orderNames = [...state.players.values()].map((p) => p.name).join(' → ');
        const actionsStr = [...state.players.values()].map(p => `${p.name}: ${p.lastAction}`).join(' | ');
        const summary = `Ordre appliqué: ${orderNames}. Actions: ${actionsStr}`;

        io.to(roomId).emit('server', { type: 'roundResolved', summary });

        // Journal persistant (non bloquant)
        try {
          await prisma.journalEntry.create({
            data: { roomId, kind: 'system', content: summary }
          });
        } catch (e) {
          // on évite de faire planter le WS pour un souci DB
          console.error('journal persist failed', e);
        }

        // reset ready pour le round suivant
        for (const v of state.players.values()) { v.ready = false; v.lastAction = undefined; }
        broadcastWaiting(io, roomId, state);
      } else {
        broadcastWaiting(io, roomId, state);
      }
    });

    socket.on('disconnect', () => {});
  });
}

function broadcastWaiting(io: Server, roomId: string, state: RoomState) {
  const missing = [...state.players.values()].filter((v) => !v.ready).map((v) => v.name);
  io.to(roomId).emit('server', { type: 'waiting', missing });
}
