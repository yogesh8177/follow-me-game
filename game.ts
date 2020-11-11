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
    
    private client: Client;
    private server: Server;

    constructor(private config?: GameConfig) {}

    initGameServer() {
        if (!this.config.isServer) {
            console.log('starting client...');
            this.client = new Client(); 
            this.client.initWebServer();
            return;
        }
        console.log('starting server...');
        this.server = new Server();
        this.server.initWebServer();
    }
}

new GameServer().initGameServer();