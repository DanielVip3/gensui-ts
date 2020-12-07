import { ClientEvents } from 'discord.js';
import { EventArgsOf } from '../utils/ArgsOf';
import { EventContext, EventContextData } from "./Event";

export interface EventInterceptorResponse {
    next: boolean,
    data?: EventContextData,
};

export abstract class EventInterceptor<K extends keyof ClientEvents> {
    public abstract intercept(payload?: EventArgsOf<K>, context?: EventContext): EventInterceptorResponse|Promise<EventInterceptorResponse>;
};

export abstract class EventTransformer<K extends keyof ClientEvents> extends EventInterceptor<K> {
    public async intercept(payload?: EventArgsOf<K>, context?: EventContext): Promise<EventInterceptorResponse> {
        await this.transform(payload, context);

        return {
            next: true,
        };
    }

    public abstract transform(payload?: EventArgsOf<K>, context?: EventContext): EventContext|Promise<EventContext>|void;
};