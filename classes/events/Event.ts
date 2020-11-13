import { ClientEvents } from 'discord.js';
import { EventAlreadyExistingIDError, EventNoIDError, EventNoTypeError } from '../../errors/events';
import BotEvents from '../bot/BotEvents';
import { EventContext } from './EventContext';

export type EventIdentifier = string|number;
export type EventTypes = keyof ClientEvents;

export interface EventDecoratorOptions {
    id?: EventIdentifier,
    type?: EventTypes|EventTypes[],
    once?: boolean,
};

export interface EventOptions {
    bot?: BotEvents,
    id?: EventIdentifier,
    type: EventTypes|EventTypes[],
    once?: boolean,
    handler: Function,

    /* Eventually, the method who instantiated the event (using the decorator) */
    methodName?: string,
};

export class Event {
    public bot: BotEvents;
    public readonly id: EventIdentifier;
    public readonly types: EventTypes[];
    public readonly once: boolean = false;
    private handler: Function;

    constructor(options: EventOptions) {
        if (options.bot) this.bot = options.bot;

        if (!options.id) throw new EventNoIDError(`An event${options && options.methodName ? ` (method ${options.methodName})` : ""} has been created without an id.`);

        if (this.bot && this.bot.getAllEvents && this.bot.getAllEvents().some(e => e.id === options.id)) throw new EventAlreadyExistingIDError(`An event already exists with the same id: ${options.id}.`);

        this.id = options.id;

        if (!options.type || (typeof options.type !== "string" && !Array.isArray(options.type))) throw new EventNoTypeError(`An event (ID ${options.id}) has been created without at least a type.`);
        else {
            if (!Array.isArray(options.type)) this.types = [options.type];
            else this.types = options.type;
        }

        if (!!options.once) this.once = true;

        this.handler = options.handler;
    }

    async call(...any: any[]): Promise<boolean> {
        const context: EventContext = { event: this, ...any };

        // if (!await this.callFilters(context)) return false;

        // const interceptorsResponse: CommandInterceptorResponse = await this.callInterceptors(context);
        // if (!interceptorsResponse || !interceptorsResponse.next) return false;

        const returned: any = await this.handler(context);

        // const consumersResponse: CommandConsumerResponse = await this.callConsumers(context, returned);
        // if (!consumersResponse || !consumersResponse.next) return false;

        return true;
    }
}