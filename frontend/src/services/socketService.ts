import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const getSocketUrl = (): string => {
      if (import.meta.env.VITE_SOCKET_URL) {
        return import.meta.env.VITE_SOCKET_URL;
      }
      if (typeof window !== 'undefined' && window.location) {
        const protocol = window.location.protocol;
        const hostname = window.location.hostname;
        return `${protocol}//${hostname}:5000`;
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
