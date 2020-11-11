import { Message } from 'discord.js';
import BotCommands from '../bot/BotCommands';
import { CommandNoIDError, CommandNoNameError } from '../../errors';
import { CommandFilter } from './CommandFilter';
import { CommandInterceptor, CommandInterceptorResponse } from './CommandInterceptor';
import { CommandConsumer, CommandConsumerResponse } from './CommandConsumer';
import { ExceptionHandler } from '../exception-handler/ExceptionHandler';
import { CommandContext } from './CommandContext';

export { CommandContext, CommandContextData } from './CommandContext';

export type CommandIdentifier = string|number;

export interface CommandMetadata {
    [key: string]: any;
};

export interface CommandGlobalOptions {
    filters?: CommandFilter[],
    interceptors?: CommandInterceptor[],
    consumers?: CommandConsumer[]
};

export interface CommandDecoratorOptions {
    id?: CommandIdentifier,
    names?: string|string[],
    description?: string,
    filters?: CommandFilter[]|CommandFilter,
    interceptors?: CommandInterceptor[]|CommandInterceptor,
    consumers?: CommandConsumer[]|CommandConsumer,
    metadata?: CommandMetadata,
};

export interface CommandOptions {
    bot?: BotCommands,
    id?: CommandIdentifier,
    names: string|string[],
    description?: string,
    filters?: CommandFilter[]|CommandFilter,
    interceptors?: CommandInterceptor[]|CommandInterceptor,
    consumers?: CommandConsumer[]|CommandConsumer,
    exceptions?: ExceptionHandler[],
    handler: Function,
    /* Eventually, the method who instantiated the command (using the decorator) */
    methodName?: string,
    
    metadata?: CommandMetadata,
};

export class Command {
    public bot: BotCommands;
    public readonly id: CommandIdentifier;
    private _names: string[];
    private _description?: string;
    protected filters: CommandFilter[] = [];
    protected interceptors: CommandInterceptor[] = [];
    protected consumers: CommandConsumer[] = [];
    protected exceptions: ExceptionHandler[] = [];
    private handler: Function;
    public metadata: CommandMetadata = {};

    constructor(options: CommandOptions) {
        if (options.bot) this.bot = options.bot;

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

        if (options.description) this._description = options.description;

        if (options.filters) {
            if (Array.isArray(options.filters)) this.filters = options.filters;
            else if (!Array.isArray(options.filters)) this.filters = [options.filters];
        }

        if (options.interceptors) {
            if (Array.isArray(options.interceptors)) this.interceptors = options.interceptors;
            else if (!Array.isArray(options.interceptors)) this.interceptors = [options.interceptors];
        }

        if (options.consumers) {
            if (Array.isArray(options.consumers)) this.consumers = options.consumers;
            else if (!Array.isArray(options.consumers)) this.consumers = [options.consumers];
        }

        if (options.exceptions) {
            if (Array.isArray(options.exceptions)) this.exceptions = options.exceptions;
            else if (!Array.isArray(options.exceptions)) this.exceptions = [options.exceptions];
        }
        if (this.exceptions) this.exceptions = this.exceptions.filter(e => !!e.id);

        if (this.bot) {
            if (this.bot.globalFilters) this.filters.unshift(...this.bot.globalFilters);
            if (this.bot.globalInterceptors) this.interceptors.unshift(...this.bot.globalInterceptors);
            if (this.bot.globalConsumers) this.consumers.unshift(...this.bot.globalConsumers);
        }

        if (options.metadata) this.metadata = options.metadata;

        this.handler = options.handler;
    }

    get names(): string[] {
        return this._names;
    }

    get description(): string|undefined {
        return this._description;
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

    async callFilters(ctx: CommandContext): Promise<boolean> {
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

    async callInterceptors(ctx: CommandContext): Promise<CommandInterceptorResponse> {
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
                    await this.callExceptionHandlers(ctx, err);
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

    async callConsumers(ctx: CommandContext, returnData: any): Promise<CommandConsumerResponse> {
        let continueFlow: boolean = true;
        let mergedData: object = {};

        if (this.consumers) {
            for (let consumer of this.consumers) {
                try {
                    const response: CommandConsumerResponse = await consumer.consume(ctx, returnData);

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
                    await this.callExceptionHandlers(ctx, err);
                    continueFlow = false;

                    break;
                }
            }
        }
        
        return {
            next: continueFlow,
            data: mergedData
        } as CommandConsumerResponse;
    }

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
}