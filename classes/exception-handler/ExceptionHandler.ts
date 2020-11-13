import { CommandIdentifier, CommandContext } from "../commands/Command";
import { EventIdentifier, EventContext } from "../events/Event";

export { CommandExceptionHandler } from './CommandExceptionHandler';
export { EventExceptionHandler } from './EventExceptionHandler';

export interface ExceptionInlineDecoratorOptions {
    exceptions?: any[],
    handler: Function,
}

export interface ExceptionDecoratorOptions {
    id?: CommandIdentifier|EventIdentifier,
    exceptions?: any[],
}

export interface ExceptionHandler {
    id: CommandIdentifier|EventIdentifier,
    exceptions?: any[],
    handler(ctx: CommandContext|EventContext, exception: any): any
}