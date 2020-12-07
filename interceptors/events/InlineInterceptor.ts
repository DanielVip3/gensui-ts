import { ClientEvents } from 'discord.js';
import { EventInterceptor, EventInterceptorResponse } from '../../classes/events/EventInterceptor';
import { EventPayload, EventContext } from '../../classes/events/Event';

export interface InlineEventInterceptorCallback {
    (payload: EventPayload<any>, ctx?: EventContext): EventInterceptorResponse|Promise<EventInterceptorResponse>,
};

/*
A simple interceptor which accepts an inline callback function.
DOES NOT pair with exceptions - i.e. you can't catch exceptions called inside this interceptor (for now).
*/
export default class InlineEventInterceptor<K extends keyof ClientEvents> extends EventInterceptor<K> {
    private readonly callback: InlineEventInterceptorCallback;
    
    constructor(callback: InlineEventInterceptorCallback) {
        super();

        this.callback = callback;
    }

    public async intercept(payload: EventPayload<K>, ctx?: EventContext): Promise<EventInterceptorResponse> {
        return await this.callback(payload, ctx);
    }
};