import { Server } from 'socket.io';

type RoomState = {
  players: Map<string, { name: string; ready: boolean; lastAction?: string }>;
};

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

    socket.on('playerAction', ({ roomId, userId, action }: { roomId: string; userId: string; action: string }) => {
      const state = rooms.get(roomId);
      if (!state) return;
      const p = state.players.get(userId);
      if (!p) return;
      p.ready = true;
      p.lastAction = action;

      if ([...state.players.values()].every((v) => v.ready)) {
        // In a real app, request UI order; here we just use joined order:
        const order = [...state.players.values()].map((p) => p.name).join(' → ');
        const summary = `Ordre appliqué: ${order}. Actions: ${[...state.players.values()].map(p => `${p.name}: ${p.lastAction}`).join(' | ')}`;
        io.to(roomId).emit('server', { type: 'roundResolved', summary });
        // reset ready for next round
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
