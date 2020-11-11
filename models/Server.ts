import * as ws from 'ws';
import WebSocket from 'isomorphic-ws';
import GameConfig from './GameConfig';
import {config} from '../decorators/decorators';
import ServerAbstract from '../models/ServerAbstract';
import {Instruction, InstructionState} from './Instruction';
import { Message, MessageType } from '../models/Message';

@config
export default class Server extends ServerAbstract {

    private wsServer: ws.Server;
    private currentSocket: WebSocket;
    private gameConfig: GameConfig;
    private currentScore: number = 0;
    private currentTotalTimeouts: number = 0;
    private currentInstruction: Instruction;
    private messageHandlerMap;

    constructor(private config?: GameConfig) { 
        super(); 
        this.messageHandlerMap = {
            [MessageType.INSTRUCTION]: 'calculateScore'
        };
        console.log('Server instance created');
    }

    initWebServer() {
        this.initKeyPressHandler();
        this.gameConfig = this.config;
        this.wsServer = new ws.Server({port: this.config.serverPort, noServer: true});
        this.wsServer.on('connection', socket => {
            console.log('Server: client connected!');
            this.resetScore();
            this.currentSocket = socket;
            this.currentSocket.on('message', message => this.receiveMessage(message, this.currentSocket));
        });
    }

    receiveMessage(message, clientSocket) {
        let jsonMessage = JSON.parse(message);
        //console.log('Server: message  received', jsonMessage);
        if (this.messageHandlerMap.hasOwnProperty(jsonMessage.type)) {
            // call respective message handler based on message type!
            let handlerName = this.messageHandlerMap[jsonMessage.type];
            this[handlerName](jsonMessage, clientSocket);
        }
        else {
            console.error('unexpected message type encountered!');
            console.error(message);
        }
    }

    sendInstruction(key) {
        if (this.currentInstruction?.state === InstructionState.VALID) {
            console.log('Please wait for current instruction to complete!');
            return;
        }
        if (this.currentSocket) {
            this.currentInstruction = null;
            let instruction = new Instruction('server');
            instruction.key = key;
            instruction.eventEmitter.on('timeout', timeStamp => this.validateTimeouts(timeStamp));
            //instruction.timeoutInSeconds = 10;
            this.currentInstruction = instruction;
            //console.log('sending instruction', instruction);
            let message: Message = { type:  MessageType.INSTRUCTION, data: instruction};
            this.sendViaSocket(this.currentSocket, message);
            return;
        }
        console.log('OOps! something went wrong!');
    }

    validateTimeouts(timeStamp) {
        this.currentTotalTimeouts++;
        //console.log({totalTimeouts: this.currentTotalTimeouts, timeStamp});
        if (this.currentTotalTimeouts >= this.config.maxTimeoutMisses) {
            let overMessage = this.generateInfoMessage('Game over due to timeouts!');
            console.log('Game over due to timeouts!');
            this.currentSocket.send(JSON.stringify(overMessage));
            this.syncScore(this.currentSocket);
            this.resetScore();
            return;
        }
        this.syncScore(this.currentSocket);
    }

    generateInfoMessage(payload): Message {
        return { type: MessageType.INFO, data: payload };
    }
    
    calculateScore(message, clientSocket) {
        //console.log('executing calculate score', message);
        if (!this.currentInstruction) {
            let infoMessage = this.generateInfoMessage('client sent key before we have initialized our instruction');
            
            console.log(infoMessage.data);
            this.sendViaSocket(clientSocket, infoMessage);
            return;
        }

        if (this.currentInstruction.state === InstructionState.EXPIRED) {
            let infoMessage = this.generateInfoMessage('timeout! You replied late!' );
            console.log(infoMessage.data);
            this.sendViaSocket(clientSocket, infoMessage);
            this.syncScore(clientSocket);
            return;
        }

        if (
            this.currentInstruction.state === InstructionState.FINISHED || 
            this.currentInstruction.state === InstructionState.WRONG
        ) {
            let infoMessage = this.generateInfoMessage('You have already answered! Wait for the next instruction!');
            console.log(infoMessage.data);
            this.sendViaSocket(clientSocket, infoMessage);
            return;
        }

        if (message.data.key === this.currentInstruction.key) {
            this.currentInstruction.state = InstructionState.FINISHED;
            this.currentScore++;

            if (this.currentScore >= this.config.maxScore) {
                console.log('Client won!!');
                let winMessage = this.generateInfoMessage("##############     You win!!!!    #############");
                this.sendViaSocket(clientSocket, winMessage);
                this.syncScore(clientSocket);
                this.resetScore();
                return;
            }
            this.syncScore(clientSocket);
        }
        else if (message.data.key !== this.currentInstruction.key) {
            this.currentInstruction.state = InstructionState.WRONG;
            this.currentScore--;
            if (this.currentScore <= this.config.minScore) {
                console.log('Game over!!');
                let looseMessage = this.generateInfoMessage("##############     You loose!!!!    #############");
                this.sendViaSocket(clientSocket, looseMessage);
                this.syncScore(clientSocket);
                this.resetScore();
                return;
            }
            this.syncScore(clientSocket);
        }
        else {
            console.log('unexpected flow!!');
        }
        console.log({currentScore: this.currentScore});
    }

    syncScore(clientSocket) {
        let message: Message = {
            type: MessageType.SCORE,
            data: this.currentScore
        };
        this.sendViaSocket(clientSocket, message);
    }

    sendViaSocket(socket, payload) {
        if (!socket) {
            console.error('Client is not connected, please wait till a client connects!');
            return;
        }
        socket.send(JSON.stringify(payload));
    }

    resetScore() {
        this.currentScore = 0;
        this.currentTotalTimeouts = 0;
        this.currentInstruction = null;
    }
}