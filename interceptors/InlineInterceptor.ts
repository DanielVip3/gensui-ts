import { CommandInterceptor, CommandInterceptorResponse } from '../classes/commands/CommandInterceptor';
import { CommandContext } from '../classes/commands/Command';

export interface InlineInterceptorCallback {
    (ctx: CommandContext): CommandInterceptorResponse
};

/*
A simple interceptor which accepts an inline callback function.
DOES NOT pair with exceptions - i.e. you can't catch exceptions called inside this interceptor (for now).
Also, it can't be asynchronous.
*/
export default class InlineInterceptor implements CommandInterceptor {
    private readonly callback: InlineInterceptorCallback;
    
    constructor(callback: InlineInterceptorCallback) {
        this.callback = callback;
    }

    public intercept(ctx: CommandContext): CommandInterceptorResponse {
        return this.callback(ctx);
    }
};