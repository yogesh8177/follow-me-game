import * as dotenv from 'dotenv';
dotenv.config();
import GameConfig from '../models/GameConfig';

const configObject: GameConfig = {
  port: parseInt(process.env.PORT),
  isServer: process.env.IS_SERVER === 'true' ? true : false,
  maxScore: parseInt(process.env.MAX_SCORE) || 10,
  minScore: parseInt(process.env.MIN_SCORE) || -3,
  timeOutInSeconds: parseInt(process.env.TIMEOUT_IN_SECONDS) || 5,
  maxTimeoutMisses: parseInt(process.env.MAX_TIMEOUT_MISSES) || 3
};

const config = <T extends { new (...args: any[]): {} }>(
    constructor: T
  ) => {
    return class extends constructor {
        config = configObject
    };
}

export default config;