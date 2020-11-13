import { EventFilter } from '../../classes/events/EventFilter';
import { EventPayload, EventContext } from '../../classes/events/Event';
import { ClientEvents } from 'discord.js';

export interface InlineFilterCallback {
    (ctx: EventContext): boolean|Promise<boolean>,
};

/*
A simple filter which allows an inline callback function to determine if to execute the event handler.
DOES NOT pair with exceptions - i.e. you can't catch exceptions called inside this filter (for now).
*/
export default class InlineFilter<K extends keyof ClientEvents> implements EventFilter<K> {
    private readonly callback: InlineFilterCallback;
    public readonly whitelist: boolean;
    
    constructor(callback: InlineFilterCallback, whitelist: boolean = true) {
        this.callback = callback;
        this.whitelist = whitelist;
    }

    public async filter(payload: EventPayload<K>, ctx: EventContext): Promise<boolean> {
        return this.whitelist 
                            ? !!await this.callback(ctx)
                            : !await this.callback(ctx);
    }

    public handleError(filtered: boolean): void { return; }
};