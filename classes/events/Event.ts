import { ClientEvents } from 'discord.js';
import { EventAlreadyExistingIDError, EventNoIDError, EventNoTypeError } from '../../errors/events';
import BotEvents from '../bot/BotEvents';
import { EventContext, EventPayload } from './EventContext';
import { EventFilter } from './EventFilter';
import { EventInterceptor, EventInterceptorResponse } from './EventInterceptor';
import { EventConsumer, EventConsumerResponse } from './EventConsumer';
import { EventExceptionHandler } from '../exception-handler/EventExceptionHandler';

export { EventContext, EventContextData, EventPayload } from './EventContext';

export type EventIdentifier = string|number;
export type EventTypes = keyof ClientEvents;

export interface EventDecoratorOptions {
    id?: EventIdentifier,
    type?: EventTypes|EventTypes[],
    once?: boolean,
    filters?: EventFilter<any>[]|EventFilter<any>,
    interceptors?: EventInterceptor<any>[]|EventInterceptor<any>,
    consumers?: EventConsumer<any>[]|EventConsumer<any>,
};

export interface EventOptions {
    bot?: BotEvents,
    id?: EventIdentifier,
    type: EventTypes|EventTypes[],
    once?: boolean,
    filters?: EventFilter<any>[]|EventFilter<any>,
    interceptors?: EventInterceptor<any>[]|EventInterceptor<any>,
    consumers?: EventConsumer<any>[]|EventConsumer<any>,
    exceptions?: EventExceptionHandler[],
    handler: (payload?: EventPayload<any>, context?: EventContext) => any|void,

    /* Eventually, the method who instantiated the event (using the decorator) */
    methodName?: string,
};

export class Event {
    public bot: BotEvents;
    public readonly id: EventIdentifier;
    public readonly types: EventTypes[];
    public readonly once: boolean = false;
    protected filters: EventFilter<any>[] = [];
    protected interceptors: EventInterceptor<any>[] = [];
    protected consumers: EventConsumer<any>[] = [];
    protected exceptions: EventExceptionHandler[] = [];
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

        if (options.filters) {
            if (Array.isArray(options.filters)) this.filters = options.filters;
            else if (!Array.isArray(options.filters)) this.filters = [options.filters];
        }

        if (options.interceptors) {
            if (Array.isArray(options.interceptors)) this.interceptors = options.interceptors;
            else if (!Array.isArray(options.interceptors)) this.interceptors = [options.interceptors];
        }

        if (options.consumers) {
            if (Array.isArray(options.consumers)) this.consumers = options.consumers;
            else if (!Array.isArray(options.consumers)) this.consumers = [options.consumers];
        }

        if (options.exceptions) {
            if (Array.isArray(options.exceptions)) this.exceptions = options.exceptions;
            else if (!Array.isArray(options.exceptions)) this.exceptions = [options.exceptions];
        }
        if (this.exceptions) this.exceptions = this.exceptions.filter(e => !!e.id);

        if (this.bot) {
            if (this.bot.globalEventFilters) this.filters.unshift(...this.bot.globalEventFilters);
            if (this.bot.globalEventInterceptors) this.interceptors.unshift(...this.bot.globalEventInterceptors);
            if (this.bot.globalEventConsumers) this.consumers.unshift(...this.bot.globalEventConsumers);
        }


        this.handler = options.handler;
    }

    addExceptionHandler(exceptionHandler: EventExceptionHandler): boolean {
        if (!exceptionHandler.id || !exceptionHandler.handler) return false;

        this.exceptions.push(exceptionHandler);
        
        return true;
    }

    async callExceptionHandlers(ctx: EventContext, exception: any): Promise<boolean> {
        if (this.exceptions && this.exceptions.length >= 1) {
            const toCallHandlers: EventExceptionHandler[] = this.exceptions.filter(e => !e.exceptions || e.exceptions.length <= 0 || e.exceptions.some((e) => exception instanceof e));
            if (toCallHandlers) {
                for (const h of toCallHandlers) await h.handler(ctx, exception);

                return true;
            } else return false;
        } else return false;
    }

    async callFilters(ctx: EventContext): Promise<boolean> {
        let valid: boolean = true;

        if (this.filters) {
            for (let filter of this.filters) {
                try {
                    await filter.handleError(await filter.filter(ctx), ctx);
                } catch(err) {
                    await this.callExceptionHandlers(ctx, err);
                    valid = false;
                }
            }
        }

        return valid;
    }

    async callInterceptors(ctx: EventContext): Promise<EventInterceptorResponse> {
        let continueFlow: boolean = true;
        let mergedData: object = {};

        if (this.interceptors) {
            for (let interceptor of this.interceptors) {
                try {
                    const response: EventInterceptorResponse = await interceptor.intercept(ctx);

                    if (!!response.next || response.next === undefined) continueFlow = true;
                    else if (!response.next) continueFlow = false;
                    else continueFlow = true;

                    if (!response.data || typeof response.data !== "object") continue;
                    mergedData = {
                        ...mergedData,
                        ...response.data,
                    };

                    ctx.data = mergedData;
                } catch(err) {
                    await this.callExceptionHandlers(ctx, err);
                    continueFlow = false;

                    break;
                }
            }
        }
        
        return {
            next: continueFlow,
            data: mergedData
        } as EventInterceptorResponse;
    }

    async callConsumers(ctx: EventContext, returnData: any): Promise<EventConsumerResponse> {
        let continueFlow: boolean = true;
        let mergedData: object = {};

        if (this.consumers) {
            for (let consumer of this.consumers) {
                try {
                    const response: EventConsumerResponse = await consumer.consume(ctx, returnData);

                    if (!!response.next || response.next === undefined) continueFlow = true;
                    else if (!response.next) continueFlow = false;
                    else continueFlow = true;

                    if (!response.data || typeof response.data !== "object") continue;
                    mergedData = {
                        ...mergedData,
                        ...response.data,
                    };

                    ctx.data = mergedData;
                } catch(err) {
                    await this.callExceptionHandlers(ctx, err);
                    continueFlow = false;

                    break;
                }
            }
        }
        
        return {
            next: continueFlow,
            data: mergedData
        } as EventConsumerResponse;
    }

    async call(...any: any[]): Promise<boolean> {
        const context: EventContext = { event: this, ...any };

        if (!await this.callFilters(context)) return false;

        const interceptorsResponse: EventInterceptorResponse = await this.callInterceptors(context);
        if (!interceptorsResponse || !interceptorsResponse.next) return false;

        const returned: any = await this.handler(any, context);

        const consumersResponse: EventConsumerResponse = await this.callConsumers(context, returned);
        if (!consumersResponse || !consumersResponse.next) return false;

        return true;
    }
}