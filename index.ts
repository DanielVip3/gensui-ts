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
    token: "NzcyNDg2NjE5ODkzNTk2MTcx.X57YOg.QqPsSuoblV__rY-sbXP7YkaFdwE",
    prefix: "!"
}, () => {
    console.log("Bot startato!");
});

bot.constant({
    roles: {
        Espresso: "776798598402277397",
    }
});

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
        parser: new CommandArgsParser([
            {
                id: "a",
                type: "number",
                default: 1,
                processor: ({ value }) => null,
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

    @bot.Sandbox()
    testSafe() {
        // console.log("test");
    }
}

bot.start();