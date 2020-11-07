import { Message } from 'discord.js';
import { CommandNoIDError, CommandNoNameError, CommandCooldownError } from '../errors';
import { MemoryCooldownStore, RedisCooldownStore, CooldownStoreObject } from './CommandCooldownStores';
import { CommandFilter } from './CommandFilter';
import { CommandInterceptor, CommandInterceptorResponse, CommandInterceptorData } from './CommandInterceptor';
import { ExceptionHandler } from './ExceptionHandler';

export type CommandIdentifier = string|number;

export interface CommandDecoratorOptions {
    id?: CommandIdentifier,
    names?: string|string[],
    cooldownStore?: MemoryCooldownStore|RedisCooldownStore|null|undefined,
    filters?: CommandFilter[]|CommandFilter,
    interceptors?: CommandInterceptor[]|CommandInterceptor,
}

export interface CommandOptions {
    id?: CommandIdentifier,
    names: string|string[],
    cooldown?: boolean,
    cooldownStore?: MemoryCooldownStore|RedisCooldownStore|null|undefined,
    filters?: CommandFilter[]|CommandFilter,
    interceptors?: CommandInterceptor[]|CommandInterceptor,
    exceptions?: ExceptionHandler[],
    handler: Function,
    /* Eventually, the method who instantiated the command (using the decorator) */
    methodName?: string,
}

export interface CommandContext {
    command: Command,
    message: Message,
    data?: CommandInterceptorData,
}

export interface CommandMetadata {
    [key: string]: any;
};

export class Command {
    public readonly id: CommandIdentifier;
    private _names: string[];
    readonly cooldown: boolean = false;
    readonly cooldownStore: MemoryCooldownStore|RedisCooldownStore|null|undefined;
    readonly cooldownEnabled: boolean = false;
    protected filters: CommandFilter[] = [];
    protected interceptors: CommandInterceptor[] = [];
    protected exceptions: ExceptionHandler[] = [];
    private handler: Function;
    public metadata: CommandMetadata;

    constructor(options: CommandOptions) {
        /* Checks names for eventual errors and sets the _names array */
        const checkForNames: Function = () => {
            if (!options.names || options.names.length <= 0) throw new CommandNoNameError(`Command${this.id ? ` (id ${this.id})` : (options && options.methodName ? ` (method ${options.methodName})` : "")} must have at least one name.`, this.id);

            if (typeof options.names === "string") this._names = [options.names];
            else this._names = options.names;
        };

        if (!options.id && ((!options.names || options.names.length <= 0))) throw new CommandNoIDError(`A command${options && options.methodName ? ` (method ${options.methodName})` : ""} has been created without an id or at least a name.`);
        else if (options.id) {
            this.id = options.id;
            checkForNames();
        } else if (options.names || options.names.length >= 1) {
            checkForNames();
            this.id = options.names[0];
        }

        if (options.cooldownStore && (options.cooldownStore instanceof MemoryCooldownStore || options.cooldownStore instanceof RedisCooldownStore)) {
            this.cooldown = !!options.cooldown;
            this.cooldownStore = options.cooldownStore;
        } else {
            this.cooldown = false;
        }

        if (options.filters) {
            if (Array.isArray(options.filters)) this.filters = options.filters;
            else if (!Array.isArray(options.filters)) this.filters = [options.filters];
        }

        if (options.interceptors) {
            if (Array.isArray(options.interceptors)) this.interceptors = options.interceptors;
            else if (!Array.isArray(options.interceptors)) this.interceptors = [options.interceptors];
        }

        if (options.exceptions) {
            if (Array.isArray(options.exceptions)) this.exceptions = options.exceptions;
            else if (!Array.isArray(options.exceptions)) this.exceptions = [options.exceptions];
        }
        if (this.exceptions) this.exceptions = this.exceptions.filter(e => !!e.id);

        if (this.cooldown && this.cooldownStore) this.cooldownEnabled = true;

        this.handler = options.handler;
    }

    get names(): string[] {
        return this._names;
    }

    addExceptionHandler(exceptionHandler: ExceptionHandler): boolean {
        if (!exceptionHandler.id || !exceptionHandler.handler) return false;

        this.exceptions.push(exceptionHandler);
        
        return true;
    }

    async callExceptionHandlers(ctx: CommandContext, exception: any): Promise<boolean> {
        if (this.exceptions && this.exceptions.length >= 1) {
            const toCallHandlers: ExceptionHandler[] = this.exceptions.filter(e => !e.exceptions || e.exceptions.length <= 0 || e.exceptions.some((e) => exception instanceof e));
            if (toCallHandlers) {
                for (const h of toCallHandlers) await h.handler(ctx, exception);
                
                return true;
            } else return false;
        } else return false;
    }

    async handleFilters(ctx: CommandContext): Promise<boolean> {
        let valid: boolean = true;

        if (this.filters) {
            for (let filter of this.filters) {
                try {
                    await filter.handleError(await filter.filter(ctx), ctx);
                } catch(err) {
                    await this.callExceptionHandlers(ctx, err);
                    valid = false;
                }
            }
        }

        return valid;
    }

    async handleInterceptors(ctx: CommandContext): Promise<CommandInterceptorResponse> {
        let continueFlow: boolean = true;
        let mergedData: object = {};

        if (this.interceptors) {
            for (let interceptor of this.interceptors) {
                try {
                    const response: CommandInterceptorResponse = await interceptor.intercept(ctx);

                    if (!!response.next || response.next === undefined) continueFlow = true;
                    else if (!response.next) continueFlow = false;
                    else continueFlow = true;

                    if (!response.data || typeof response.data !== "object") continue;
                    mergedData = {
                        ...mergedData,
                        ...response.data,
                    };

                    ctx.data = mergedData;
                } catch(err) {
                    this.callExceptionHandlers(ctx, err);
                    continueFlow = false;

                    break;
                }
            }
        }
        
        return {
            next: continueFlow,
            data: mergedData
        } as CommandInterceptorResponse;
    }

    async call(message: Message): Promise<boolean> {
        const context: CommandContext = { command: this, message };

        if (!await this.handleFilters(context)) return false;

        const interceptorsResponse: CommandInterceptorResponse = await this.handleInterceptors(context);
        if (!interceptorsResponse || !interceptorsResponse.next) return false;

        /*if (this.cooldownEnabled && this.cooldownStore) {
            if (await this.isInCooldown(message.author.id)) {
                const cooldown: CooldownStoreObject|null = await this.cooldownStore.getCooldown(message.author.id);
                if (cooldown) throw new CommandCooldownError("Command is in cooldown.", cooldown.called, this.cooldownStore.cooldownTime);
                else throw new CommandCooldownError("Command is in cooldown.");
            } else {
                this.cooldownStore.increaseCooldown(message.author.id);
                this.handler(message);

                return true;
            }
        }*/

        this.handler(context);

        return true;
    }

    isInCooldown(userId?: string): boolean {
        if (!userId) return false;

        if (!this.cooldownEnabled) return false;
        else {
            if (this.cooldownStore && this.cooldownStore.isInCooldown(userId)) return true;

            return false;
        }
    }
}