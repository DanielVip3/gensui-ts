import { CommandInterceptor, CommandInterceptorResponse } from '../classes/commands/CommandInterceptor';
import { CommandContext } from '../classes/commands/Command';

export interface InlineInterceptorCallback {
    (ctx: CommandContext): CommandInterceptorResponse|Promise<CommandInterceptorResponse>,
};

/*
A simple interceptor which accepts an inline callback function.
DOES NOT pair with exceptions - i.e. you can't catch exceptions called inside this interceptor (for now).
*/
export default class InlineInterceptor implements CommandInterceptor {
    private readonly callback: InlineInterceptorCallback;
    
    constructor(callback: InlineInterceptorCallback) {
        this.callback = callback;
    }

    public async intercept(ctx: CommandContext): Promise<CommandInterceptorResponse> {
        return await this.callback(ctx);
    }
};