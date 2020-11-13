import { Event } from "./Event";
import { EventArgsOf } from '../utils/ArgsOf';
import { ClientEvents } from "discord.js";

export { EventArgsOf } from '../utils/ArgsOf';

export interface EventContextData {
    [key: string]: any;
};

export type EventPayload<K extends keyof ClientEvents> = EventArgsOf<K>;

export interface EventContext {
    event: Event,
    data?: EventContextData,
};