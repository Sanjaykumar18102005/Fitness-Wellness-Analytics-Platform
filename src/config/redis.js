const Redis = require('ioredis');

const redisHost = process.env.REDIS_HOST || 'localhost';
const redisPort = parseInt(process.env.REDIS_PORT || '6379', 10);

let redisClient = null;
let redisPublisher = null;
let redisSubscriber = null;
let isConnected = false;

// In-Memory Redis fallback if Redis server is unreachable
class InMemoryCache {
  constructor() {
    this.store = new Map();
  }

  async get(key) {
    return this.store.get(key) || null;
  }

  async set(key, value, mode, duration) {
    this.store.set(key, value);
    if (mode === 'EX' && duration) {
      setTimeout(() => this.store.delete(key), duration * 1000);
    }
    return 'OK';
  }

  async del(key) {
    return this.store.delete(key) ? 1 : 0;
  }

  async publish(channel, message) {
    return 1;
  }
}

const memoryCache = new InMemoryCache();

function getRedisClient() {
  if (redisClient) return isConnected ? redisClient : memoryCache;

  try {
    redisClient = new Redis({
      host: redisHost,
      port: redisPort,
      maxRetriesPerRequest: 1,
      retryStrategy: () => null, // don't retry endlessly if Redis is down
      lazyConnect: true,
    });

    redisClient.on('connect', () => {
      isConnected = true;
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (err) => {
      isConnected = false;
      // Fail quietly and use memory cache fallback
    });

    redisClient.connect().catch(() => {
      isConnected = false;
    });
  } catch (err) {
    isConnected = false;
  }

  return isConnected ? redisClient : memoryCache;
}

module.exports = {
  getRedisClient,
  memoryCache,
};
