

import { Message, MessageType } from '../models/Message';

const syncScore = (
    target: Object,
    propertyKey: string,
    descriptor: PropertyDescriptor
) => {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {

        const result = originalMethod.apply(this, args);
        let message: Message = {
            type: MessageType.SCORE,
            data: this.currentScore
        };
        if (this.currentSocket) 
            this.currentSocket.send(JSON.stringify(message));
        else
            console.error('No client connected, cannot sync score!');
    };

    return descriptor;
};

export default syncScore;