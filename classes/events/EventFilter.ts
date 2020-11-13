import { ClientEvents } from 'discord.js';
import { EventArgsOf } from '../utils/ArgsOf';
import { EventContext } from './Event';

export abstract class EventFilter<K extends keyof ClientEvents> {
    public readonly abstract whitelist: boolean;

    public abstract filter(payload?: EventArgsOf<K>, context?: EventContext): boolean|Promise<boolean>|void|Promise<void>;
    public abstract handleError(filtered: boolean|Promise<boolean>|void|Promise<void>, payload?: EventArgsOf<K>, context?: EventContext, ...any: []);
}