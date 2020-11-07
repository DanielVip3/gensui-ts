import { CommandContext } from './Command';

export abstract class CommandFilter {
    public abstract whitelist: boolean;

    public abstract filter(context?: CommandContext, ...any: []): boolean|Promise<boolean>|void|Promise<void>;
    public abstract handleError(filtered: boolean|Promise<boolean>|void|Promise<void>, context?: CommandContext, ...any: []);
}