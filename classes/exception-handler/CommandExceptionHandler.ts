import { CommandIdentifier, CommandContext } from "../commands/Command";

export interface CommandExceptionDecoratorOptions {
    id?: CommandIdentifier,
    exceptions?: any[],
}

export interface CommandExceptionHandler {
    id: CommandIdentifier,
    exceptions?: any[],
    handler(ctx: CommandContext, exception: any): any
}