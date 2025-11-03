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

const app = express();
const PORT = process.env.PORT || 4000;

app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

app.use('/api', routes);

app.use(errorHandler);

const start = async () => {
  await connectDB();
  const server = http.createServer(app);
  const io = new Server(server, { cors: { origin: '*' } });
  socketHandler(io);

  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

start();
