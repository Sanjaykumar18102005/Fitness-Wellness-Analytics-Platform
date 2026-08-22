// Single-DB Architecture In-Memory Cache Helper (No Redis required)
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
  return memoryCache;
}

module.exports = {
  getRedisClient,
  memoryCache,
};
