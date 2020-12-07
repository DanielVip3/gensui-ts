import { ClientEvents } from 'discord.js';
import { EventArgsOf } from '../utils/ArgsOf';
import { EventContext, EventContextData } from "./Event";

export interface EventConsumerResponse {
    next: boolean,
    data?: EventContextData,
};

export abstract class EventConsumer<K extends keyof ClientEvents> {
    public abstract consume(payload?: EventArgsOf<K>, context?: EventContext, returnData?: any, ...any: []): EventConsumerResponse|Promise<EventConsumerResponse>;
};

export abstract class EventSideEffect<K extends keyof ClientEvents> extends EventConsumer<K> {
    public async consume(payload?: EventArgsOf<K>, context?: EventContext, returnData?: any): Promise<EventConsumerResponse> {
        await this.effect(payload, context);

        return {
            next: true,
        };
    }

    public abstract effect(payload?: EventArgsOf<K>, context?: EventContext): EventContext|Promise<EventContext>|void;
};