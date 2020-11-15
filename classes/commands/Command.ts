import { Message } from 'discord.js';
import BotCommands from '../bot/BotCommands';
import { CommandAlreadyExistingIDError, CommandNoIDError, CommandNoNameError } from '../../errors';
import { CommandFilter } from './CommandFilter';
import { CommandInterceptor, CommandInterceptorResponse } from './CommandInterceptor';
import { CommandConsumer, CommandConsumerResponse } from './CommandConsumer';
import { CommandExceptionHandler } from '../exception-handler/ExceptionHandler';
import { CommandContext } from './CommandContext';
import { CommandCallOptions } from './CommandCallOptions';
import { CommandArgsParser } from './args/CommandArgsParser';
import { CommandArgs } from './args/CommandArgs';

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
    parser?: CommandArgsParser,
    interceptors?: CommandInterceptor[]|CommandInterceptor,
    consumers?: CommandConsumer[]|CommandConsumer,
    metadata?: CommandMetadata,
    argumentsDivider?: string,
};

export interface CommandOptions {
    bot?: BotCommands,
    id?: CommandIdentifier,
    names: string|string[],
    description?: string,
    filters?: CommandFilter[]|CommandFilter,
    parser?: CommandArgsParser,
    interceptors?: CommandInterceptor[]|CommandInterceptor,
    consumers?: CommandConsumer[]|CommandConsumer,
    exceptions?: CommandExceptionHandler[],
    handler: (context: CommandContext) => any|void,
    
    /* Eventually, the method who instantiated the command (using the decorator) */
    methodName?: string,
    
    metadata?: CommandMetadata,
    argumentsDivider?: string,
};

export class Command {
    public bot: BotCommands;
    public readonly id: CommandIdentifier;
    private _names: string[];
    private _description?: string;
    protected filters: CommandFilter[] = [];
    protected parser: CommandArgsParser;
    protected interceptors: CommandInterceptor[] = [];
    protected consumers: CommandConsumer[] = [];
    protected exceptions: CommandExceptionHandler[] = [];
    private handler: Function;
    public metadata: CommandMetadata = {};
    public argumentsDivider: string = " ";

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

        if (this.bot && this.bot.getAllCommands && this.bot.getAllCommands().some(e => e.id === options.id)) throw new CommandAlreadyExistingIDError(`A command already exists with the same id: ${options.id}.`);

        if (options.description) this._description = options.description;

        if (options.filters) {
            if (Array.isArray(options.filters)) this.filters = options.filters;
            else if (!Array.isArray(options.filters)) this.filters = [options.filters];
        }

        if (options.parser) this.parser = options.parser;

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
            if (this.bot.globalCommandFilters) this.filters.unshift(...this.bot.globalCommandFilters);
            if (this.bot.globalCommandInterceptors) this.interceptors.unshift(...this.bot.globalCommandInterceptors);
            if (this.bot.globalCommandConsumers) this.consumers.unshift(...this.bot.globalCommandConsumers);
        }

        if (options.metadata) this.metadata = options.metadata;

        if (options.argumentsDivider) this.argumentsDivider = options.argumentsDivider;

        this.handler = options.handler;
    }

    get names(): string[] {
        return this._names;
    }

    get description(): string|undefined {
        return this._description;
    }

    addExceptionHandler(exceptionHandler: CommandExceptionHandler): boolean {
        if (!exceptionHandler.id || !exceptionHandler.handler) return false;

        this.exceptions.push(exceptionHandler);
        
        return true;
    }

    async callExceptionHandlers(ctx: CommandContext, exception: any): Promise<boolean> {
        if (this.exceptions && this.exceptions.length >= 1) {
            const toCallHandlers: CommandExceptionHandler[] = this.exceptions.filter(e => !e.exceptions || e.exceptions.length <= 0 || e.exceptions.some((e) => exception instanceof e));
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

    async callParser(ctx: CommandContext): Promise<CommandArgs|null> {
        if (!ctx.call) return null;

        function convertRawArgsArrayToArgsObject(rawArguments: string[]): CommandArgs {
            let argsObj: CommandArgs = {};

            let i: number = 0;
            for (let argument of rawArguments) argsObj[i++] = argument;

            return argsObj;
        }

        if (!this.parser) return await convertRawArgsArrayToArgsObject(ctx.call.rawArguments);

        try {
            return await this.parser.parse(ctx.message, ctx.call);
        } catch(err) {
            console.error(err);
            await this.callExceptionHandlers(ctx, err);
            
            return null;
        }
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

    async call(message: Message, callOptions?: CommandCallOptions): Promise<boolean> {
        const context: CommandContext = { command: this, message, call: callOptions };

        if (!await this.callFilters(context)) return false;

        if (context.call) {
            const args: CommandArgs|null = await this.callParser(context);

            context.call.arguments = args;
        }

        const interceptorsResponse: CommandInterceptorResponse = await this.callInterceptors(context);
        if (!interceptorsResponse || !interceptorsResponse.next) return false;

        const returned: any = await this.handler(context);

        const consumersResponse: CommandConsumerResponse = await this.callConsumers(context, returned);
        if (!consumersResponse || !consumersResponse.next) return false;

        return true;
    }
}