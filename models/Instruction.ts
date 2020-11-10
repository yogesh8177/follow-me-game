import { timeStamp } from '../decorators/decorators';

export default class Instruction {
    @timeStamp()
    id: number;
    key: string;
}