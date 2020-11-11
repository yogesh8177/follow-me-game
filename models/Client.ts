import WebSocket from 'isomorphic-ws';
import GameConfig from './GameConfig';
import {config} from '../decorators/decorators';
import ServerAbstract from '../models/ServerAbstract';
import {Instruction, InstructionState} from './Instruction';
import { Message, MessageType } from '../models/Message';
import { clearInterval } from 'timers';

@config
export default class Client extends ServerAbstract {

    private wsServer: WebSocket;
    private messageHandlerMap;
    private countDownTimer: any;
    private currentScore: number = 0;

    constructor(private config?: GameConfig) { 
        super(); 
        this.messageHandlerMap = {
            [MessageType.INSTRUCTION]: 'instructionReceiver',
            [MessageType.SCORE]: 'syncScore',
            [MessageType.INFO]: 'infoMessage'
        };
    }

    initWebServer() {
        this.wsServer = new WebSocket(this.config.serverUrl);
        this.wsServer.on('open', socket => {
            console.log('client: connected to server!');
            this.initKeyPressHandler();
        });
        this.wsServer.on('message', message => this.receiveMessage(message, this, this.wsServer));
    }

    receiveMessage(message, classInstance, server) {
        let jsonMessage: Message = JSON.parse(message);
        if (jsonMessage.type === MessageType.INSTRUCTION)
            this.initCountDown(jsonMessage.data.timeoutInSeconds);
        //console.log('client: message received', jsonMessage);

        if (classInstance.messageHandlerMap.hasOwnProperty(jsonMessage.type)) {
            classInstance[classInstance.messageHandlerMap[jsonMessage.type]](jsonMessage, server);
        }
        else {
            console.error('unexpected message type encountered!');
            console.error(message);
        }
    }

    initCountDown(timeout: number) {
        let timeoutPeriod  = timeout;
        let count = 1;
        this.countDownTimer = setInterval(() => {
            console.log(`You have ${timeoutPeriod - count} seconds to answer`);
            count++;
            if (count > timeoutPeriod){
                console.log('timed out!');
                clearInterval(this.countDownTimer);
            }
        }, 1000);
    }

    sendInstruction(key) {
        this.resetTimer();
        let instruction = new Instruction('client');
        instruction.key = key;
        //console.log('sending instruction', instruction);
        let message: Message = { type:  MessageType.INSTRUCTION, data: instruction};
        this.wsServer.send(JSON.stringify(message));
    }

    instructionReceiver (message, serverSocket) {
        console.log('client: instruction received', message.data.key);
    }

    syncScore(message, serverSocket) {
        this.currentScore = message.data;
        console.log(`Total score: ${this.currentScore}`);
    }

    infoMessage(message, serverSocket) {
        console.log(message.data);
    }

    resetTimer() {
        clearInterval(this.countDownTimer);
    }
}