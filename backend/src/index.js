require('dotenv').config();
const express = require('express');
require('express-async-errors');
const morgan = require('morgan');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');

const connectDB = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middlewares/errorHandler');
const socketHandler = require('./socket');

const app = require('./app');
const PORT = process.env.PORT || 4000;

const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  // Make io available via app and initialize socket handlers
  app.set('io', io);
  socketHandler(io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

if (require.main === module) {
  start();
}

module.exports = { start, app };
