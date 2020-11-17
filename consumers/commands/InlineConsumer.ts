import { CommandConsumer, CommandConsumerResponse } from '../../classes/commands/CommandConsumer';
import { CommandContext } from '../../classes/commands/Command';

export interface InlineCommandConsumerCallback {
    (ctx: CommandContext, returnData?: any): CommandConsumerResponse|Promise<CommandConsumerResponse>,
};

/*
A simple consumer which accepts an inline callback function.
DOES NOT pair with exceptions - i.e. you can't catch exceptions called inside this consumer (for now).
*/
export default class InlineCommandConsumer implements CommandConsumer {
    private readonly callback: InlineCommandConsumerCallback;
    
    constructor(callback: InlineCommandConsumerCallback) {
        this.callback = callback;
    }

    public async consume(ctx: CommandContext, returnData?: any): Promise<CommandConsumerResponse> {
        return await this.callback(ctx, returnData);
    }
};