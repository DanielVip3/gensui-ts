import { CommandFilter } from '../../classes/commands/CommandFilter';
import { CommandContext } from '../../classes/commands/Command';

export interface InlineCommandFilterCallback {
    (ctx: CommandContext): boolean|Promise<boolean>,
};

/*
A simple filter which allows an inline callback function to determine if to execute the command handler.
DOES NOT pair with exceptions - i.e. you can't catch exceptions called inside this filter (for now).
*/
export default class InlineCommandFilter extends CommandFilter {
    private readonly callback: InlineCommandFilterCallback;
    public readonly whitelist: boolean;
    
    constructor(callback: InlineCommandFilterCallback, whitelist: boolean = true) {
        super();

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