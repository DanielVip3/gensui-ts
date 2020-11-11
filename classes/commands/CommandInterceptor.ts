import { CommandContext } from "./Command";

export interface CommandInterceptorData {
    [key: string]: any;
}

export interface CommandInterceptorResponse {
    next: boolean,
    data?: CommandInterceptorData,
};

export abstract class CommandInterceptor {
    public abstract intercept(context: CommandContext, ...any: []): CommandInterceptorResponse|Promise<CommandInterceptorResponse>;
};

export abstract class CommandTransformer implements CommandInterceptor {
    public async intercept(context: CommandContext): Promise<CommandInterceptorResponse> {
        await this.transform(context);

        return {
            next: true,
        };
    }

    public abstract transform(context: CommandContext): CommandContext|Promise<CommandContext>|void;
};