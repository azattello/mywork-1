module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);

    // Join user-specific room for notifications
    socket.on('join_user_room', (userId) => {
      socket.join(`user_${userId}`);
      console.log(`Socket ${socket.id} joined user room user_${userId}`);
    });

    socket.on('join', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('leave', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    socket.on('message', (payload) => {
      // payload: { conversationId, message }
      if (payload && payload.conversationId) {
        io.to(payload.conversationId).emit('message', payload.message);
      }
    });

    socket.on('send_message', async (payload) => {
      // payload: { conversationId, to, text, from }
      if (!payload || !payload.conversationId) {
        return;
      }

      try {
        // Create message in database
        const Message = require('./models/Message');
        const message = new Message({
          conversation: payload.conversationId,
          from: payload.from,
          to: payload.to,
          text: payload.text,
          isRead: false,
        });
        await message.save();

        // Broadcast to room
        io.to(payload.conversationId).emit('message', {
          conversation: payload.conversationId,
          message: message,
        });
      } catch (error) {
        console.error('Error saving message:', error);
        socket.emit('error', { message: 'Failed to save message' });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected', socket.id);
    });
  });
};
