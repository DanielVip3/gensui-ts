import { ClientEvents } from 'discord.js';
import { EventNoIDError, EventNoTypeError } from '../../errors/events';
import { EventContext } from './EventContext';

export type EventIdentifier = string|number;
export type EventTypes = keyof ClientEvents;

export interface EventDecoratorOptions {
    id?: EventIdentifier,
    type: EventTypes|EventTypes[],
};

export interface EventOptions {
    id?: EventIdentifier,
    type: EventTypes|EventTypes[],
    handler: Function,

    /* Eventually, the method who instantiated the event (using the decorator) */
    methodName?: string,
};

export class Event {
    public readonly id: EventIdentifier;
    public readonly types: EventTypes[];
    private handler: Function;

    constructor(options: EventOptions) {
        if (!options.id) throw new EventNoIDError(`An event${options && options.methodName ? ` (method ${options.methodName})` : ""} has been created without an id.`);

        this.id = options.id;

        if (!options.type || (typeof options.type !== "string" && !Array.isArray(options.type))) throw new EventNoTypeError(`An event (ID ${options.id}) has been created without at least a type.`);
        else {
            if (!Array.isArray(options.type)) this.types = [options.type];
            else this.types = options.type;
        }

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