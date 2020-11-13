import { EventContext, EventContextData } from "./Event";

export interface EventConsumerResponse {
    next: boolean,
    data?: EventContextData,
};

export abstract class EventConsumer {
    public abstract consume(context: EventContext, returnData: any, ...any: []): EventConsumerResponse|Promise<EventConsumerResponse>;
};

export abstract class EventSideEffect implements EventConsumer {
    public async consume(context: EventContext): Promise<EventConsumerResponse> {
        await this.effect(context);

        return {
            next: true,
        };
    }

    public abstract effect(context: EventContext): EventContext|Promise<EventContext>|void;
};