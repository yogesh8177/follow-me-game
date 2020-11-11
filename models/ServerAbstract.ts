import * as readline from 'readline';

readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

export default abstract class ServerAbstract {
    abstract initWebServer();
    
    initKeyPressHandler() {
        console.log('initialized key handler');
        process.stdin.on('keypress', (str, key) => {
            if (key.ctrl && key.name === 'c') {
                process.exit();
            } else {
                console.log(`You pressed the "${str}" key`);
                console.log();
                //console.log(key);
                //console.log();
                this.sendInstruction(key.name);
            }
        });
    }

    // send instruction to client/server
    abstract sendInstruction(key);

    // receive message from client/server
    abstract receiveMessage(message, socket);
}