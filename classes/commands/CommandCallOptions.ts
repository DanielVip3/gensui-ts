import { CommandArgs } from "./args/CommandArgs";

export interface CommandCallOptions {
    /* The prefix which was used to call the command, or null if the command was called from the bot mention. */
    prefix: string|null,

    /* The name which was used to call the command, or null if the command was called from the bot mention. */
    name: string|null,

    /* If the command was called from the bot mention or not. */
    mentionHandled: boolean,

    /* The command arguments provided as-are, without parsing or processing them; they are split by space character " " from starting message content. */
    rawArguments: string[],

    /* The command arguments after being parsed if a parser was specified, else provided as-are. They usually are not null, but they can be. */
    arguments: CommandArgs|null,
};