import { EventContext } from './Event';

export abstract class EventFilter {
    public readonly abstract whitelist: boolean;

    public abstract filter(context?: EventContext, ...any: []): boolean|Promise<boolean>|void|Promise<void>;
    public abstract handleError(filtered: boolean|Promise<boolean>|void|Promise<void>, context?: EventContext, ...any: []);
}