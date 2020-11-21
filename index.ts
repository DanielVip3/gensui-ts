import './config/yup-locale';
import Bot from './classes/Bot';

import { Filters } from './filters/Filters';
import { Interceptors } from './interceptors/Interceptors';
import { Consumers } from './consumers/Consumers';
import { CommandContext, CommandIdentifier } from './classes/commands/Command';
import { MemoryCooldownStore } from './classes/utils/CooldownStores';
import { EventContext, EventPayload } from './classes/events/EventContext';
import { CommandArgsParser } from './classes/commands/args/CommandArgsParser';
import { ClientEvents } from 'discord.js';
import { EventFilter } from './classes/events/EventFilter';

const bot: Bot = new Bot({
    name: "Genshiro Bot",
    token: "NzcyNDg2NjE5ODkzNTk2MTcx.X57YOg.QqPsSuoblV__rY-sbXP7YkaFdwE",
    prefix: "!"
}, () => {
    console.log("Bot startato!");
});

bot.constant({
    cutiesCafeServer: "776479917965180938",
    eliBotId: "472831424903380992",
    bumpersRoleId: "776479918666022944",
    roles: {
        Espresso: "776798598402277397",
    }
});

class EventGuildsFilter implements EventFilter<"message"> {
    private readonly guilds: string[]|string;
    public readonly whitelist: boolean;

    constructor(guilds: string[]|string, whitelist: boolean = true) {
        this.guilds = guilds;
        if (this.guilds && !Array.isArray(this.guilds) && typeof this.guilds === "string") this.guilds = [this.guilds];

        this.whitelist = whitelist;
    }

    public filter([message,]: EventPayload<"message">, context: EventContext): boolean {
        console.log(message, this.guilds);
        if (!message || !message.guild) return false;
        if (!this.guilds || !Array.isArray(this.guilds) || this.guilds.length <= 0) return !this.whitelist;

        console.log(this.guilds.includes(message.guild.id) || this.guilds.includes(message.guild.name));
        if (this.guilds.includes(message.guild.id) || this.guilds.includes(message.guild.name)) return !!this.whitelist;
        else return !this.whitelist;
    }

    public handleError(filtered: boolean): void {
        if (!filtered) throw new Error("The guilds filter failed.");
    }
}

abstract class BumpSelfbot {
    @bot.Scope("disboard-selfbot") id: CommandIdentifier;

    @bot.Filter(
        new EventGuildsFilter(bot.get("cutiesCafeServer"), true),
        Filters.Events.Inline(([message,]: EventPayload<"message">) => { return message.author.id === bot.get("eliBotId") }),
        Filters.Events.Inline(([message,]: EventPayload<"message">) => !!message.embeds && !!message.embeds[0]),
        Filters.Events.Inline(([message,]: EventPayload<"message">) => !!message.embeds[0].description && message.embeds[0].description.includes(bot.get("bumpersRoleId"))),
    )
    @bot.Event()
    message([message,]: EventPayload<"message">, context: EventContext) {
        console.log("HAH! BUMP");

        /*message.channel.send("!d bump");*/
    }
}

/*
abstract class Commands {
    @bot.Scope(1) id: CommandIdentifier;
    @bot.Inject(bot.get("roles", "Espresso")) static espresso: string;

    @bot.Apply(
        Filters.Commands._NSFW,
        Interceptors.Commands.Cooldown(new MemoryCooldownStore()),
        Consumers.Commands._Log
    )
    @bot.Metadata({ showHelp: false })
    @bot.Command({
        id: "testf",
        parser: new CommandArgsParser([
            {
                id: "a",
                type: "number",
                default: 1,
                processor: ({ value }) => value > 3,
            }
        ])
    })
    testf({ command, message, data, call }: CommandContext): void {
        console.log(call.arguments);
    }

    @bot.Command()
    testf2({ command, message, data }: CommandContext): void {
        console.log(data);
    }

    @bot.Apply(Consumers.Commands._Log)
    @bot.Event()
    guildMemberUpdate([oldMember, newMember]: EventPayload<"guildMemberUpdate">, update: EventContext): void {
        // console.log(oldMember.displayName, newMember.displayName, update);
    }

    @bot.ExceptCommand({
        id: "testf",
        exceptions: []
    })
    onException(ctx: CommandContext, exception: any) {
        console.log(exception);
    }

    @bot.Sandbox()
    testSafe() {
        // console.log("test");
    }
}
*/

bot.start();