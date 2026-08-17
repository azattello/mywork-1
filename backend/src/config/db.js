const mongoose = require('mongoose');
let mongoMemoryServer = null;

const connectDB = async () => {
  let uri = process.env.MONGO_URI;

  const connectWithUri = async (targetUri) => {
    await mongoose.connect(targetUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  };

  if (!uri && process.env.NODE_ENV === 'production') {
    throw new Error('MONGO_URI not set in env');
  }

  if (!uri) {
    // Lazy require to avoid adding overhead in production paths
    const { MongoMemoryServer } = require('mongodb-memory-server');
    console.log('MONGO_URI not set — starting in-memory MongoDB for development');
    mongoMemoryServer = await MongoMemoryServer.create();
    uri = mongoMemoryServer.getUri();
  }

  try {
    await connectWithUri(uri);
    console.log('MongoDB connected');
  } catch (err) {
    if (process.env.NODE_ENV === 'production') throw err;
    console.warn('MongoDB connection failed, falling back to in-memory MongoDB:', err.message);
    const { MongoMemoryServer } = require('mongodb-memory-server');
    mongoMemoryServer = await MongoMemoryServer.create();
    const memUri = mongoMemoryServer.getUri();
    await connectWithUri(memUri);
    console.log('MongoDB connected (in-memory)');
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (mongoMemoryServer) {
    try { await mongoMemoryServer.stop(); } catch (e) { /* ignore */ }
  }
};

module.exports = connectDB;
module.exports.disconnectDB = disconnectDB;
