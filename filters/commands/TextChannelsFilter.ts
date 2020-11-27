import { CommandFilter } from '../../classes/commands/CommandFilter';
import { CommandContext } from '../../classes/commands/Command';
import { DMChannel } from 'discord.js';
import { TextChannelsError } from '../../errors';

export default class TextChannelsFilter implements CommandFilter {
    private readonly channels: string[]|string;
    public readonly whitelist: boolean;

    constructor(channels: string[]|string, whitelist: boolean = true) {
        this.channels = channels;
        if (this.channels && !Array.isArray(this.channels) && typeof this.channels === "string") this.channels = [this.channels];

        this.whitelist = whitelist;
    }

    public filter({ command, message }: CommandContext): boolean {
        if (!message || !message.channel) return false;
        if (!this.channels || !Array.isArray(this.channels) || this.channels.length <= 0) return !this.whitelist;

        if (this.channels.includes(message.channel.id)) return !!this.whitelist;

        if (message.channel instanceof DMChannel && 'recipient' in message.channel) {
            if (this.channels.includes(message.channel.recipient.id)
                || this.channels.includes(message.channel.recipient.username)
                || this.channels.includes(`${message.channel.recipient.username}#${message.channel.recipient.discriminator}`)) return !!this.whitelist;
            else return !this.whitelist;
        } else if (this.channels.includes(message.channel.name)) return !!this.whitelist;
        else return !this.whitelist;
    }

    public handleError(filtered: boolean): void {
        if (!filtered) throw new TextChannelsError("The text channels filter failed.", this.channels, this.whitelist);
    }
}