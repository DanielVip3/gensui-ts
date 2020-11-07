import { CommandFilter } from '../classes/CommandFilter';
import { CommandContext } from '../classes/Command';
import { DMError } from '../errors';
import { DMChannel } from 'discord.js';

export default class DMFilter implements CommandFilter {
    public readonly whitelist: boolean;
    
    constructor(whitelist: boolean = true) {
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