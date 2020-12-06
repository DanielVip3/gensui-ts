require('dotenv').config({ path: __dirname+'/.env' });

import './config/yup-locale';
import Bot from './classes/Bot';

import { Filters } from './filters/Filters';
import { Interceptors } from './interceptors/Interceptors';
import { Consumers } from './consumers/Consumers';
import { CommandContext, CommandIdentifier } from './classes/commands/Command';
import { MemoryCooldownStore } from './classes/utils/CooldownStores';
import { EventContext, EventPayload } from './classes/events/EventContext';
import { CommandArgsParser } from './classes/commands/args/CommandArgsParser';

const bot: Bot = new Bot({
    name: "Genshiro Bot",
    token: process.env.TEST_BOT_TOKEN as string,
    prefix: "!"
}, () => {
    console.log("Bot startato!");
});

bot.constant({
    roles: {
        test: "776798598402277397",
    }
});

abstract class Commands {
    @bot.Scope(1) id: CommandIdentifier;
    @bot.Inject(bot.get("roles", "test")) static test: string;

    @bot.Apply(
        Filters.Commands._NSFW,
        Interceptors.Commands.Cooldown(new MemoryCooldownStore()),
        Consumers.Commands._Log
    )
    @bot.Metadata({ showHelp: false })
    @bot.Command({
        id: "testf",
        parser: new CommandArgsParser(
            {
                id: "a",
                type: "number",
                default: 1,
                processor: ({ value }) => value > 3,
            }
        )
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

bot.start();