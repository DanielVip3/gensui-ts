import { CommandIdentifier, CommandContext } from "./Command";

export interface ExceptionDecoratorOptions {
    id?: CommandIdentifier,
    exceptions?: any[],
}

export interface ExceptionHandler {
    id: CommandIdentifier,
    exceptions?: any[],
    handler(ctx: CommandContext, exception: any): any
}