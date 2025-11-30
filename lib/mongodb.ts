import mongoose from 'mongoose';

function getMongoUri(): string {
  // Try environment variables first
  if (process.env.MONGODB_URI) {
    return process.env.MONGODB_URI;
  }
  if (process.env.TEST_MONGODB_URI) {
    return process.env.TEST_MONGODB_URI;
  }
  // Default to local MongoDB
  return 'mongodb://localhost:27017/lor-task';
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache | undefined;
}

let cached: MongooseCache = global.mongoose || { conn: null, promise: null };

if (!global.mongoose) {
  global.mongoose = cached;
}

async function connectDB() {
  const MONGODB_URI = getMongoUri();
  
  // In test environment, allow graceful failure
  if (process.env.NODE_ENV === 'test' || process.env.PLAYWRIGHT_TEST) {
    if (!process.env.MONGODB_URI && !process.env.TEST_MONGODB_URI) {
      console.warn('MONGODB_URI not set - connection skipped in test mode');
      return null;
    }
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    // Log error but don't throw in development to allow app to start
    if (process.env.NODE_ENV === 'development') {
      console.error('MongoDB connection error:', e);
      console.warn('App will continue but database features may not work');
      return null;
    }
    throw e;
  }

  return cached.conn;
}

export default connectDB;

