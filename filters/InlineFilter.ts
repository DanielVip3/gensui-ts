import { CommandFilter } from '../classes/commands/CommandFilter';
import { CommandContext } from '../classes/commands/Command';

export interface InlineFilterCallback {
    (ctx: CommandContext): boolean|Promise<boolean>,
};

/*
A simple filter which allows an inline callback function to determine if to execute the command handler.
DOES NOT pair with exceptions - i.e. you can't catch exceptions called inside this filter (for now).
*/
export default class InlineFilter implements CommandFilter {
    private readonly callback: InlineFilterCallback;
    public readonly whitelist: boolean;
    
    constructor(callback: InlineFilterCallback, whitelist: boolean = true) {
        this.callback = callback;
        this.whitelist = whitelist;
    }

    public async filter(ctx: CommandContext): Promise<boolean> {
        return this.whitelist 
                            ? !!await this.callback(ctx)
                            : !await this.callback(ctx);
    }

    public handleError(filtered: boolean): void { return; }
};