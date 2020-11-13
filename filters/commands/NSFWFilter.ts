import { CommandFilter } from '../../classes/commands/CommandFilter';
import { CommandContext } from '../../classes/commands/Command';
import { NSFWError } from '../../errors';

export default class NSFWFilter implements CommandFilter {
    public readonly whitelist: boolean;
    
    constructor(whitelist: boolean = true) {
        this.whitelist = whitelist;
    }

    public filter({ command, message }: CommandContext): boolean {
        if (message && message.channel && 'nsfw' in message.channel && !!message.channel.nsfw) return !!this.whitelist;
        else return !this.whitelist;
    }

    public handleError(filtered: boolean): void {
        if (!filtered) throw new NSFWError("The NSFW filter failed.", this.whitelist);
    }
}