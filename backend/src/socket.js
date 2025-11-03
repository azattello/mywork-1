module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected', socket.id);

    socket.on('join', (room) => {
      socket.join(room);
    });

    socket.on('leave', (room) => {
      socket.leave(room);
    });

    socket.on('message', (payload) => {
      // payload: { conversationId, message }
      if (payload && payload.conversationId) {
        io.to(payload.conversationId).emit('message', payload.message);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected', socket.id);
    });
  });
};
