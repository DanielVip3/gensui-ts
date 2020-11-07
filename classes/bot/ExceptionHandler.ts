import { CommandIdentifier, CommandContext } from "../commands/Command";

export interface ExceptionDecoratorOptions {
    id?: CommandIdentifier,
    exceptions?: any[],
}

export interface ExceptionHandler {
    id: CommandIdentifier,
    exceptions?: any[],
    handler(ctx: CommandContext, exception: any): any
}