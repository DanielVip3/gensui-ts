import { Client } from "discord.js";
import { EventGlobalHookError } from "../../errors/bot";
import ExceptionNoReferenceError from "../../errors/exception-handler/ExceptionNoReferenceError";
import { Event, EventIdentifier } from "../events/Event";
import { EventConsumer } from "../events/EventConsumer";
import { EventFilter } from "../events/EventFilter";
import { EventInterceptor } from "../events/EventInterceptor";
import { EventExceptionHandler } from "../exception-handler/EventExceptionHandler";

export default class BotEvents {
    protected client: Client;
    protected events: Event[] = [];
    public readonly globalEventFilters: EventFilter<any>[] = [];
    public readonly globalEventInterceptors: EventInterceptor<any>[] = [];
    public readonly globalEventConsumers: EventConsumer<any>[] = [];

    constructor(startingEvents?: Event|Event[]) {
        if (startingEvents) {
            if (Array.isArray(startingEvents)) this.events = this.events.concat(startingEvents);
            else this.events.push(startingEvents);
        }
    }

    addGlobalEventFilter(filter: EventFilter<any>): boolean {
        if (this.events && Array.isArray(this.events) && this.events.length >= 1) throw new EventGlobalHookError("Global filter(s) must be added before creating any event.");

        this.globalEventFilters.push(filter);

        return true;
    }

    addGlobalEventInterceptor(interceptor: EventInterceptor<any>): boolean {
        if (this.events && Array.isArray(this.events) && this.events.length >= 1) throw new EventGlobalHookError("Global interceptor(s) must be added before creating any event.");

        this.globalEventInterceptors.push(interceptor);

        return true;
    }

    addGlobalEventConsumer(consumer: EventConsumer<any>): boolean {
        if (this.events && Array.isArray(this.events) && this.events.length >= 1) throw new EventGlobalHookError("Global consumer(s) must be added before creating any event.");

        this.globalEventConsumers.push(consumer);

        return true;
    }

    addEventExceptionHandler(exceptionHandler: EventExceptionHandler): boolean {
        if (!exceptionHandler.id) return false;
        const event: Event|undefined = this.getEvent(exceptionHandler.id);
        if (!event) throw new ExceptionNoReferenceError(`Exception handler (event ID ${exceptionHandler.id}) does not refer to an existing event ID. Could it be you declared the exception handler BEFORE the event itself?`);
        
        event.addExceptionHandler(exceptionHandler);

        return true;
    }

    addEvent(event: Event): Event {
        this.events.push(event);

        if (this.client) for (let type of event.types) {
            this.client[event.once ? "once" : "on"](type, event.call.bind(event));
        }

        return event;
    }

    removeEvent(eventId: EventIdentifier): Event {
        const eventIndex: number = this.events.findIndex(e => e.id === eventId);
        const event: Event = this.events[eventIndex];

        this.events.splice(eventIndex, 1);

        if (this.client) for (let type of event.types) {
            this.client.removeListener(type, event.call.bind(event));
        }

        return event;
    }

    getEvent(eventId: EventIdentifier): Event|undefined {
        return this.events.find(c => c.id === eventId);
    }

    getAllEvents(): Event[] {
        return this.events;
    }
};