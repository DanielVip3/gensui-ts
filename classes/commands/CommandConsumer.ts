import { CommandContext } from "./Command";

export interface CommandConsumerData {
    [key: string]: any;
}

export interface CommandConsumerResponse {
    next: boolean,
    data?: CommandConsumerData,
};

export abstract class CommandConsumer {
    public abstract consume(context: CommandContext, returnData: any, ...any: []): CommandConsumerResponse|Promise<CommandConsumerResponse>;
};