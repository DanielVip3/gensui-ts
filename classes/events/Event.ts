import { Message } from 'discord.js';

export type EventIdentifier = string|number;

export interface EventOptions {
    id?: EventIdentifier,
    type: string|string[],
    handler: Function,
    /* Eventually, the method who instantiated the event (using the decorator) */
    methodName?: string,
};

export class Event {
    public readonly id: EventIdentifier;
    private types: string|string[];
    private _description?: string;
    private handler: Function;

    constructor(options: EventOptions) {
        if (!options.id) throw new EventNoIDError(`An event${options && options.methodName ? ` (method ${options.methodName})` : ""} has been created without an id.`);

        if (!options.type) throw new EventNoTypeError(`An event (ID ${options.id}) has been created without at least a type.`);

        this.handler = options.handler;
    }

    /*
    async call(message: Message): Promise<boolean> {
        const context: CommandContext = { command: this, message };

        if (!await this.callFilters(context)) return false;

        const interceptorsResponse: CommandInterceptorResponse = await this.callInterceptors(context);
        if (!interceptorsResponse || !interceptorsResponse.next) return false;

        const returned: any = await this.handler(context);

        const consumersResponse: CommandConsumerResponse = await this.callConsumers(context, returned);
        if (!consumersResponse || !consumersResponse.next) return false;

        return true;
    }
    */
}