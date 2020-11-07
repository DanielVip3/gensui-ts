import { CommandContext } from "./Command";

export interface CommandInterceptorData {
    [key: string]: any;
}

export interface CommandInterceptorResponse {
    next?: boolean,
    data?: CommandInterceptorData,
};

export abstract class CommandInterceptor {
    public abstract intercept(context: CommandContext, ...any: []): CommandInterceptorResponse;
};