import { CommandFilter } from '../../classes/commands/CommandFilter';
import { CommandContext } from '../../classes/commands/Command';
import { DMError } from '../../errors';
import { DMChannel } from 'discord.js';

export default class DMFilter extends CommandFilter {
    public readonly whitelist: boolean;
    
    constructor(whitelist: boolean = true) {
        super();

        this.whitelist = whitelist;
    }

    public filter({ command, message }: CommandContext): boolean {
        if (message && message.channel && message.channel instanceof DMChannel) return !!this.whitelist;
        else return !this.whitelist;
    }

    public handleError(filtered: boolean): void {
        if (!filtered) throw new DMError("The direct messages (DM) filter failed.", this.whitelist);
    }
}