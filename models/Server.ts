import * as ws from 'ws';
import WebSocket from 'isomorphic-ws';
import GameConfig from './GameConfig';
import {config} from '../decorators/decorators';
import ServerAbstract from '../models/ServerAbstract';
import {Instruction, InstructionState} from './Instruction';
import { Message, MessageType } from '../models/Message';
import { timeStamp } from 'console';

@config
export default class Server extends ServerAbstract {

    private wsServer: ws.Server;
    private currentSocket: WebSocket;
    gameConfig: GameConfig;
    currentScore: number = 0;
    currentInstruction: Instruction;
    private messageHandlerMap;

    constructor(private config?: GameConfig) { 
        super(); 
        this.messageHandlerMap = {
            [MessageType.INSTRUCTION]: 'calculateScore'
        };
    }

    initWebServer() {
        let self = this;
        this.initKeyPressHandler();
        this.gameConfig = this.config;
        this.wsServer = new ws.Server({port: this.config.serverPort, noServer: true});
        this.wsServer.on('connection', socket => {
            console.log('Server: client connected!');
            this.currentSocket = socket;
            this.currentSocket.on('message', message => this.receiveMessage(message, this, this.currentSocket));
        });
    }

    receiveMessage(message, classInstance, clientSocket) {
        let jsonMessage = JSON.parse(message);
        //console.log('Server: message  received', jsonMessage);
        if (classInstance.messageHandlerMap.hasOwnProperty(jsonMessage.type)) {
            // call respective message handler based on message type!
            classInstance[classInstance.messageHandlerMap[jsonMessage.type]](jsonMessage, clientSocket);
        }
        else {
            console.error('unexpected message type encountered!');
            console.error(message);
        }
    }

    sendInstruction(key) {
        let instruction = new Instruction('server');
        instruction.key = key;
        //instruction.timeoutInSeconds = 10;
        this.currentInstruction = instruction;
        //console.log('sending instruction', instruction);
        let message: Message = { type:  MessageType.INSTRUCTION, data: instruction};
        this.currentSocket.send(JSON.stringify(message));
    }

    generateInfoMessage(payload): Message {
        return { type: MessageType.INFO, data: payload };
    }
    
    calculateScore(message, clientSocket) {
        console.log('executing calculate score', message);
        if (!this.currentInstruction) {
            let infoMessage = this.generateInfoMessage('client sent key before we have initialized our instruction');
            
            console.log(infoMessage.data);
            clientSocket.send(JSON.stringify(infoMessage));
            return;
        }

        if (this.currentInstruction.state === InstructionState.EXPIRED) {
            let infoMessage = this.generateInfoMessage('timeout! You replied late!' );
            console.log(infoMessage.data);
            clientSocket.send(JSON.stringify(infoMessage));
            return;
        }

        if (
            this.currentInstruction.state === InstructionState.FINISHED || 
            this.currentInstruction.state === InstructionState.WRONG
        ) {
            let infoMessage = this.generateInfoMessage('You have already answered! Wait for the next instruction!');
            console.log(infoMessage.data);
            clientSocket.send(JSON.stringify(infoMessage));
            return;
        }

        if (message.data.key === this.currentInstruction.key) {
            this.currentInstruction.state = InstructionState.FINISHED;
            this.currentScore++;

            if (this.currentScore >= this.config.maxScore) {
                console.log('Client won!!');
                let winMessage = this.generateInfoMessage("##############     You win!!!!    #############");
                clientSocket.send(JSON.stringify(winMessage));
                this.resetScore();
            }
            this.syncScore(clientSocket);
        }
        else if (message.data.key !== this.currentInstruction.key) {
            this.currentInstruction.state = InstructionState.WRONG;
            this.currentScore--;
            if (this.currentScore <= this.config.minScore) {
                console.log('Game over!!');
                let looseMessage = this.generateInfoMessage("##############     You loose!!!!    #############");
                clientSocket.send(JSON.stringify(looseMessage));
                this.resetScore();
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
        clientSocket.send(JSON.stringify(message));
    }

    resetScore() {
        this.currentScore = 0;
        this.currentInstruction = null;
    }
}