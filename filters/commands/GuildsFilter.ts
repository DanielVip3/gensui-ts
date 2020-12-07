import { CommandFilter } from '../../classes/commands/CommandFilter';
import { CommandContext } from '../../classes/commands/Command';
import { GuildsError } from '../../errors';

export default class GuildsFilter extends CommandFilter {
    private readonly guilds: string[]|string;
    public readonly whitelist: boolean;

    constructor(guilds: string[]|string, whitelist: boolean = true) {
        super();

        this.guilds = guilds;
        if (this.guilds && !Array.isArray(this.guilds) && typeof this.guilds === "string") this.guilds = [this.guilds];

        this.whitelist = whitelist;
    }

    public filter({ command, message }: CommandContext): boolean {
        if (!message || !message.guild) return false;
        if (!this.guilds || !Array.isArray(this.guilds) || this.guilds.length <= 0) return !this.whitelist;

        if (this.guilds.includes(message.guild.id) || this.guilds.includes(message.guild.name)) return !!this.whitelist;
        else return !this.whitelist;
    }

    public handleError(filtered: boolean): void {
        if (!filtered) throw new GuildsError("The guilds filter failed.", this.guilds, this.whitelist);
    }
}