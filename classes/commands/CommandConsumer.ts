import { CommandContext, CommandContextData } from "./Command";

export interface CommandConsumerResponse {
    next: boolean,
    data?: CommandContextData,
};

export abstract class CommandConsumer {
    public abstract consume(context: CommandContext, returnData: any, ...any: []): CommandConsumerResponse|Promise<CommandConsumerResponse>;
};

export abstract class CommandSideEffect extends CommandConsumer {
    public async consume(context: CommandContext): Promise<CommandConsumerResponse> {
        await this.effect(context);

        return {
            next: true,
        };
    }

    public abstract effect(context: CommandContext): CommandContext|Promise<CommandContext>|void;
};