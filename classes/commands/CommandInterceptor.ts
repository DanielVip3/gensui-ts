import { CommandContext, CommandContextData } from "./Command";

export interface CommandInterceptorResponse {
    next: boolean,
    data?: CommandContextData,
};

export abstract class CommandInterceptor {
    public abstract intercept(context: CommandContext, ...any: []): CommandInterceptorResponse|Promise<CommandInterceptorResponse>;
};

export abstract class CommandTransformer extends CommandInterceptor {
    public async intercept(context: CommandContext): Promise<CommandInterceptorResponse> {
        await this.transform(context);

        return {
            next: true,
        };
    }

    public abstract transform(context: CommandContext): CommandContext|Promise<CommandContext>|void;
};