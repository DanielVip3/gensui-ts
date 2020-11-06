import { CommandFilter } from '../classes/CommandFilter';
import { CommandContext } from '../classes/Command';

export interface InlineFilterCallback {
    (ctx: CommandContext): boolean
};

/*
A simple filter which allows an inline callback function to determine if to execute the command handler.
DOES NOT pair with exceptions - i.e. you can't catch exceptions called inside this filter (for now).
Also, it can't be asynchronous.
*/
export default class InlineFilter implements CommandFilter {
    private readonly callback: InlineFilterCallback;
    private readonly whitelist: boolean;
    
    constructor(callback: InlineFilterCallback, whitelist: boolean = true) {
        this.callback = callback;
        this.whitelist = whitelist;
    }

    public filter(ctx: CommandContext): boolean {
        return this.whitelist 
                            ? !!this.callback(ctx)
                            : !this.callback(ctx);
    }

    public handleError(filtered: boolean): void { return; }
};