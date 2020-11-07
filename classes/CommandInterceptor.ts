import { CommandContext } from "./Command";

export interface CommandInterceptorResponse {
    next?: boolean,
    data?: Object,
};

export abstract class CommandInterceptor {
    public abstract intercept(context: CommandContext, ...any: []): CommandInterceptorResponse;
};