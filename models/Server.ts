import * as ws from 'ws';
import WebSocket from 'isomorphic-ws';
import GameConfig from './GameConfig';
import {config, syncScore} from '../decorators/decorators';
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

    @syncScore
    validateTimeouts(timeStamp) {
        this.currentTotalTimeouts++;
        //console.log({totalTimeouts: this.currentTotalTimeouts, timeStamp});
        if (this.currentTotalTimeouts >= this.config.maxTimeoutMisses) {
            let overMessage = this.generateInfoMessage('Game over due to timeouts!');
            console.log('Game over due to timeouts!');
            this.currentSocket.send(JSON.stringify(overMessage));
            this.resetScore();
            return;
        }
    }

    generateInfoMessage(payload): Message {
        return { type: MessageType.INFO, data: payload };
    }

    @syncScore
    calculateScore(message, clientSocket) {
        //console.log('executing calculate score', message);
        if (!this.currentInstruction) {
            let infoMessage = this.generateInfoMessage('client sent key before we have initialized our instruction');
            
            console.log(infoMessage.data);
            this.sendViaSocket(clientSocket, infoMessage);
            return;
        }

        let currentInstructionState = this.currentInstruction.state;
        let clientInstruction = message.data;
        let isCurrentInstructionExpired = (currentInstructionState === InstructionState.EXPIRED);

        if (isCurrentInstructionExpired) {
            let infoMessage = this.generateInfoMessage('timeout! You replied late!' );
            console.log(infoMessage.data);
            this.sendViaSocket(clientSocket, infoMessage);
            return;
        }
        let isInstructionAlreadyAnswered = currentInstructionState === InstructionState.FINISHED || 
                                            currentInstructionState === InstructionState.WRONG
        if (isInstructionAlreadyAnswered) {
            let infoMessage = this.generateInfoMessage('You have already answered! Wait for the next instruction!');
            console.log(infoMessage.data);
            this.sendViaSocket(clientSocket, infoMessage);
            return;
        }
        let clientAndServerKeyMatch = clientInstruction.key === this.currentInstruction.key;

        if (clientAndServerKeyMatch) {
            this.currentInstruction.state = InstructionState.FINISHED;
            this.currentScore++;
            this.notifyWinOrLoss(clientSocket);
        }
        else if (!clientAndServerKeyMatch) {
            this.currentInstruction.state = InstructionState.WRONG;
            this.currentScore--;
            this.notifyWinOrLoss(clientSocket);
        }
        else {
            console.log('unexpected flow!!');
        }
        console.log({currentScore: this.currentScore});
    }

    notifyWinOrLoss(clientSocket) {
        let infoMessage: Message;
        if (this.currentScore <= this.config.minScore) {
            console.log('Game over!!');
            infoMessage = this.generateInfoMessage("##############     You loose!!!!    #############");
        }
        else if (this.currentScore >= this.config.maxScore) {
            console.log('Client won!!');
            infoMessage = this.generateInfoMessage("##############     You win!!!!    #############");
        }
        else {
            console.log('Neither a win or a loss, lets continue playing..');
            return;
        }
        // we will arrive here if its a win or a loss!
        this.sendViaSocket(clientSocket, infoMessage);
        this.resetScore();
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