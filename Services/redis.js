import Redis from "ioredis"
import { REDIS_URL } from "../config";

// let redis;

const RedisService = {
  createRedisClient() {
    const redis = new Redis(REDIS_URL);
    return redis;
  },
  get(redis, key) {
    // consredis = new Redis(REDIS_URL);

    // Or ioredis returns a promise if the last argument isn't a function
    redis.get(key).then((result) => {
      // console.log(result);
      return result; // Prints "value"
    });
    return false;
  },
  set(redis, key, value, ttl) {
    // const redis = new Redis(REDIS_URL);

    redis.set(key, value, "EX", ttl).then(() => {
      // console.log(result); 
      return true;
    })
    return false;
  }
}

export default RedisService;
