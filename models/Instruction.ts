export class Instruction {
    timeStamp: number;
    key: string;
    state: InstructionState;
    source: 'client' | 'server';
    timeoutInSeconds: number;

    constructor (source, timeout?: number) {
        this.source = source;
        this.timeStamp = new Date().getTime();
        this.state = InstructionState.VALID;
        this.timeoutInSeconds = parseInt(process.env.TIMEOUT_IN_SECONDS) || 8;
        this.timeoutInSeconds = timeout ? timeout : this.timeoutInSeconds;
        this.source === 'server' && this.initCountDown();
    };


    initCountDown() {
        let timer = setTimeout(() => {
            if (this.state !== InstructionState.FINISHED && this.state !== InstructionState.WRONG) {
                this.state = InstructionState.EXPIRED;
                console.log('As client could not answer, instruction expired!', this);
            }
            else {
                console.log('instruction will not expire as it is in other valid state!', this);
            }
            clearTimeout(timer);
        }, this.timeoutInSeconds * 1000);
    }
}

export enum InstructionState {
    VALID,
    FINISHED,
    WRONG,
    EXPIRED
};