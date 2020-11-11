import { config } from './decorators/decorators';
import GameConfig from './models/GameConfig';
import Server from './models/Server';
import Client from './models/Client';

/**
 * @config decorator will load all the env variables and inject it into 
 * game class constructor
 */
@config
export class GameServer {
    
    private server: Server | Client;

    constructor(private config?: GameConfig) {}

    initGameServer() {
        this.server = this.config.isServer ? new Server() : new Client();
        this.server.initWebServer();
    }
}

new GameServer().initGameServer();