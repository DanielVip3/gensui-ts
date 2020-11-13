import { EventIdentifier, EventContext } from "../events/Event";

export interface EventExceptionDecoratorOptions {
    id?: EventIdentifier,
    exceptions?: any[],
}

export interface EventExceptionHandler {
    id: EventIdentifier,
    exceptions?: any[],
    handler(ctx: EventContext, exception: any): any
}