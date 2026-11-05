import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const getSocketUrl = (): string => {
      if (typeof window !== 'undefined' && window.location && window.location.hostname) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
          return `${protocol}//${hostname}:5000`;
        }
      }
      if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL;
      }
      return 'http://localhost:5000';
    };

    const socketUrl = getSocketUrl();
    const token = localStorage.getItem('sad_token');

    socket = io(socketUrl, {
      auth: { token },
      withCredentials: true,
      autoConnect: true,
      transports: ['websocket', 'polling']
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
