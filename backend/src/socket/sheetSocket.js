const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'sad_jwt_super_secret_dev_key_2026_institutional';

// Distinct user color palette for real-time collaboration
const COLLABORATOR_COLORS = [
  '#2563eb', // Blue
  '#059669', // Emerald Green
  '#d97706', // Amber
  '#dc2626', // Red
  '#7c3aed', // Purple
  '#db2777', // Pink
  '#0891b2'  // Cyan
];

// Room storage: roomKey -> { activeUsers: Map(socketId -> { user, color, focusedRowId }) }
const rooms = new Map();

function initSocket(io) {
  // 1. Socket Authentication Handshake Middleware
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token;
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const decoded = jwt.verify(token, JWT_SECRET);
      socket.user = decoded; // { id, email, displayName, role }
      next();
    } catch (err) {
      next(new Error('Invalid socket credentials'));
    }
  });

  // 2. Socket Events
  io.on('connection', (socket) => {
    const user = socket.user;
    logger.debug({ user: user.email }, 'Socket connected');

    // Join Sheet Room: sheetKey:monthId:ownerId
    socket.on('join_sheet', ({ sheetKey, monthId, ownerId }) => {
      const roomKey = `sheet:${sheetKey}:${monthId}:${ownerId}`;
      socket.join(roomKey);
      socket.currentRoom = roomKey;

      if (!rooms.has(roomKey)) {
        rooms.set(roomKey, { activeUsers: new Map() });
      }

      const roomData = rooms.get(roomKey);
      const colorIndex = roomData.activeUsers.size % COLLABORATOR_COLORS.length;
      const assignedColor = COLLABORATOR_COLORS[colorIndex];

      const clientInfo = {
        userId: user.id,
        email: user.email,
        displayName: user.displayName,
        color: assignedColor,
        focusedRowId: null
      };

      roomData.activeUsers.set(socket.id, clientInfo);

      // Emit updated collaborators list to all users in the room
      io.to(roomKey).emit('collaborators_update', Array.from(roomData.activeUsers.values()));
    });

    // Row Focus Event (User clicked or started editing a row)
    socket.on('row_focus', ({ rowId }) => {
      const roomKey = socket.currentRoom;
      if (!roomKey || !rooms.has(roomKey)) return;

      const roomData = rooms.get(roomKey);
      const clientInfo = roomData.activeUsers.get(socket.id);
      if (clientInfo) {
        clientInfo.focusedRowId = rowId;
        // Broadcast row highlight to peers
        socket.to(roomKey).emit('row_highlight', {
          rowId,
          user: {
            userId: clientInfo.userId,
            displayName: clientInfo.displayName,
            color: clientInfo.color
          }
        });
      }
    });

    // Row Blur Event (User left the row)
    socket.on('row_blur', ({ rowId }) => {
      const roomKey = socket.currentRoom;
      if (!roomKey || !rooms.has(roomKey)) return;

      const roomData = rooms.get(roomKey);
      const clientInfo = roomData.activeUsers.get(socket.id);
      if (clientInfo && clientInfo.focusedRowId === rowId) {
        clientInfo.focusedRowId = null;
        socket.to(roomKey).emit('row_unhighlight', { rowId });
      }
    });

    // Clean up on disconnect
    socket.on('disconnect', () => {
      const roomKey = socket.currentRoom;
      if (roomKey && rooms.has(roomKey)) {
        const roomData = rooms.get(roomKey);
        const clientInfo = roomData.activeUsers.get(socket.id);
        if (clientInfo && clientInfo.focusedRowId) {
          socket.to(roomKey).emit('row_unhighlight', { rowId: clientInfo.focusedRowId });
        }
        roomData.activeUsers.delete(socket.id);
        io.to(roomKey).emit('collaborators_update', Array.from(roomData.activeUsers.values()));
        if (roomData.activeUsers.size === 0) {
          rooms.delete(roomKey);
        }
      }
    });
  });
}

module.exports = { initSocket };
