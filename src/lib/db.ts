import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('MONGODB_URI não definida. Adicione ao .env.local');
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// Persist connection across hot reloads in development
const globalWithMongoose = global as typeof global & { _mongooseCache?: MongooseCache };

if (!globalWithMongoose._mongooseCache) {
  globalWithMongoose._mongooseCache = { conn: null, promise: null };
}

const cache = globalWithMongoose._mongooseCache;

async function dbConnect(): Promise<typeof mongoose> {
  if (cache.conn) return cache.conn;

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI!, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    }).then(async (mg) => {
      // Ensure unique indexes exist for User collection
      try {
        const db = mg.connection.db;
        if (db) {
          await db.collection('users').createIndex({ email: 1 }, { unique: true, background: true });
          await db.collection('users').createIndex({ freefire_id: 1 }, { unique: true, background: true });
        }
      } catch {
        // Indexes may already exist — safe to ignore
      }
      return mg;
    });
  }

  cache.conn = await cache.promise;
  return cache.conn;
}

export default dbConnect;
