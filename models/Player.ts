import GameConfig from './GameConfig';
import Instruction from './Instruction';
import { config } from '../decorators/decorators';

@config
export default class Player {
    currentInstruction: Instruction;

    constructor(private config?: GameConfig) {
    }

    // send instruction to client/server
    sendInstruction(socket: WebSocket, key: string) {
        let instruction = new Instruction();
        instruction.key = key;
        //console.log('sending instruction', instruction);
        socket.send(JSON.stringify(instruction));
    }

    // receive instruction from client/server
    receiveInstruction (instruction: Instruction) {
        console.log('instruction received', instruction);
    }

    // calculate score at server
    calculateScore() {

    }

    // sync score from server to client
    syncScore() {

    }
}