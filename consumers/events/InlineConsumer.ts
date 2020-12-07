import { EventPayload, EventContext } from '../../classes/events/Event';
import { EventConsumer, EventConsumerResponse } from '../../classes/events/EventConsumer';
import { ClientEvents } from 'discord.js';

export interface InlineEventConsumerCallback {
    (payload?: EventPayload<any>, ctx?: EventContext, returnData?: any): EventConsumerResponse|Promise<EventConsumerResponse>,
};

/*
A simple consumer which accepts an inline callback function.
DOES NOT pair with exceptions - i.e. you can't catch exceptions called inside this consumer (for now).
*/
export default class InlineEventConsumer<K extends keyof ClientEvents> extends EventConsumer<K> {
    private readonly callback: InlineEventConsumerCallback;
    
    constructor(callback: InlineEventConsumerCallback) {
        super();

        this.callback = callback;
    }

    public async consume(payload?: EventPayload<K>, ctx?: EventContext, returnData?: any): Promise<EventConsumerResponse> {
        return await this.callback(payload, ctx, returnData);
    }
};