import { CommandConsumer, CommandConsumerResponse } from '../classes/commands/CommandConsumer';
import { CommandContext } from '../classes/commands/Command';

export interface InlineConsumerCallback {
    (ctx: CommandContext, returnData: any): CommandConsumerResponse
};

/*
A simple consumer which accepts an inline callback function.
DOES NOT pair with exceptions - i.e. you can't catch exceptions called inside this consumer (for now).
Also, it can't be asynchronous.
*/
export default class InlineConsumer implements CommandConsumer {
    private readonly callback: InlineConsumerCallback;
    
    constructor(callback: InlineConsumerCallback) {
        this.callback = callback;
    }

    public consume(ctx: CommandContext, returnData: any): CommandConsumerResponse {
        return this.callback(ctx, returnData);
    }
};