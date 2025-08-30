import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

type State = {
  serverUrl: string;
  roomId?: string;
  userId?: string;
  displayName?: string;
  socket?: Socket;
  missing: string[];
  summary?: string;
};

type Actions = {
  connect: (serverUrl: string, roomId: string, userId: string, displayName: string) => void;
  sendAction: (action: string) => void;
  setSummary: (s?: string) => void;
};

export const useRoom = create<State & Actions>((set, get) => ({
  serverUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? 'http://localhost:4000',
  missing: [],
  connect(serverUrl, roomId, userId, displayName) {
    const socket = io(serverUrl);
    socket.on('connect', () => {
      socket.emit('joinRoom', { roomId, userId, displayName });
    });
    socket.on('server', (msg: any) => {
      if (msg.type === 'waiting') set({ missing: msg.missing });
      if (msg.type === 'roundResolved') set({ summary: msg.summary, missing: [] });
    });
    set({ serverUrl, roomId, userId, displayName, socket });
  },
  sendAction(action: string) {
    const st = get();
    st.socket?.emit('playerAction', { roomId: st.roomId, userId: st.userId, action });
  },
  setSummary(s) { set({ summary: s }); }
}));
