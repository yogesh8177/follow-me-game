import { config } from './decorators/decorators';
import * as ws from 'ws';
import GameConfig from './models/GameConfig';
import Player from './models/Player';
import WebSocket from 'isomorphic-ws';

import * as readline from 'readline';

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

/**
 * @config decorator will load all the env variables and inject it into 
 * game class constructor
 */
@config
export class GameServer {
    playerMode: string;
    wsServer: ws.Server | WebSocket;
    player: Player;

    constructor(private config?: GameConfig) {}

    initGameServer() {
        this.playerMode = 'serverPlayer';
        if (!this.config.isServer) {
            this.playerMode = 'clientPlayer';
        }
        this.player = new Player();
        this.initWebServer();
    }

    initWebServer() {
        console.log(`initializing ${this.playerMode} server...`);
        console.log({config: this.config});
        let server;

        if (this.config.isServer) {
            this.wsServer = new ws.Server({port: this.config.port, noServer: true});
            server = this.wsServer as ws.Server;
            server.on('connection', socket => {
                console.log('server connected');
                this.initKeyPressHandler(socket);
            });
        }
        else {
            this.wsServer = new WebSocket('ws://localhost:3000');
            server = this.wsServer as WebSocket;
            server.on('open', () => {
                console.log('client connected');
                this.initKeyPressHandler(server);
            });
        }
        console.log(`${this.playerMode} started on port: `, this.config.port);
    }

    initKeyPressHandler(socket) {
        process.stdin.on('keypress', (str, key) => {
            if (key.ctrl && key.name === 'c') {
                process.exit();
            } else {
                console.log(`You pressed the "${str}" key`);
                console.log();
                console.log(key);
                console.log();
                this.player.sendInstruction(socket, key.name);
            }
        });
        socket.on('message', message => {
            this.player.receiveInstruction(message);
        });
    }
}

new GameServer().initGameServer();