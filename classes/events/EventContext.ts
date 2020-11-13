import { Event } from "./Event";

export interface EventContextData {
    [key: string]: any;
};

export interface EventContext {
    event: Event,
    data?: EventContextData,
    [key: string]: any,
};