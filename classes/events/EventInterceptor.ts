import { EventContext, EventContextData } from "./Event";

export interface EventInterceptorResponse {
    next: boolean,
    data?: EventContextData,
};

export abstract class EventInterceptor {
    public abstract intercept(context: EventContext, ...any: []): EventInterceptorResponse|Promise<EventInterceptorResponse>;
};

export abstract class EventTransformer implements EventInterceptor {
    public async intercept(context: EventContext): Promise<EventInterceptorResponse> {
        await this.transform(context);

        return {
            next: true,
        };
    }

    public abstract transform(context: EventContext): EventContext|Promise<EventContext>|void;
};