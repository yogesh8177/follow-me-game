export class Message {
    type: MessageType;
    data: any;
};

export enum MessageType {
    INSTRUCTION,
    SCORE,
    INFO
};