import { Client } from 'discord.js';

import BotCommands from './bot/BotCommands';
import BotConstants from './bot/BotConstants';
import { Command, CommandDecoratorOptions, CommandIdentifier, CommandMetadata, CommandOptions } from './commands/Command';
import { BotError, ExceptionNoIDError } from '../errors';
import { ExceptionDecoratorOptions, ExceptionHandler, ExceptionInlineDecoratorOptions } from './exception-handler/ExceptionHandler';
import { CommandFilter } from './commands/CommandFilter';
import { CommandInterceptor } from './commands/CommandInterceptor';
import { CommandConsumer } from './commands/CommandConsumer';
import { Event, EventDecoratorOptions, EventOptions, EventTypes } from './events/Event';
import { EventFilter } from './events/EventFilter';
import { EventInterceptor } from './events/EventInterceptor';
import { EventConsumer } from './events/EventConsumer';
import { Sandbox } from './sandboxes/Sandbox';
import { CommandArgsParser } from './commands/args/CommandArgsParser';

export interface BotOptions {
    name: string,
    token: string,
    owner?: string|string[],
    enableMentionHandling?: boolean,
    prefix?: string|string[],
};

export default class Bot extends BotCommands {
    public readonly options: BotOptions;
    public client: Client;
    public constants: BotConstants;
    public sandboxes: Sandbox[] = [];

    constructor(options: BotOptions, readyHandler?: Function) {
        super();

        this.options = options;

        if (this.options) {
            if (!this.options.name || typeof this.options.name !== "string") throw new BotError("Bot options should have string property 'name' which specifies bot's name.");
            if (!this.options.token || typeof this.options.token !== "string") throw new BotError("Bot options should have string property 'token' which specifies bot's Discord API token.");

            if (this.options.prefix) {
                if (Array.isArray(this.options.prefix) && !this.options.prefix.every(p => typeof p === "string")) throw new BotError("Bot options's property 'prefix' should be a string or an array of strings.");
                else if (typeof this.options.prefix !== "string") throw new BotError("Bot options's property 'prefix' should be a string or an array of strings.");
            }

            if (this.options.enableMentionHandling) this.enableMentionHandling = true;
            else this.enableMentionHandling = false;

            if (this.options.prefix) this.prefix = this.options.prefix;
        } else throw new BotError("Bot class requires an options object.");

        this.client = new Client();

        this.client.on('ready', () => {
            if (readyHandler && typeof readyHandler === "function") readyHandler();
        });
    }

    login(token?: string): Promise<string|null> {
        return this.client.login(token || this.options.token);
    }

    start(token?: string): boolean {
        try {
            this.login(token || this.options.token);
            this.startFetchingCommands(this.client);
            this.executeSandboxes();

            return true;
        } catch(err) {
            console.error(err);

            return false;
        }
    }

    executeSandboxes(): void {
        if (!this.sandboxes || !Array.isArray(this.sandboxes) || this.sandboxes.length <= 0) return;
        
        for (let sandbox of this.sandboxes) sandbox(this.client, this);
    }

    constant();
    constant(objectv: BotConstants);
    constant(objectsv: BotConstants);
    constant(...values: BotConstants[]): BotConstants {
        if (!values || !Array.isArray(values) || values.length <= 0) return this.constants;
        else if (values) {
            if (Array.isArray(values)) {
                if (values.length === 1) {
                    this.constants = { ...this.constants, ...values[0] as Object };
                } else if (values.length > 1) {
                    Object.assign(this.constants, this.constants, ...values);
                }

                return this.constants;
            } else {
                this.constants = { ...this.constants, ...values[0] as Object };

                return this.constants;
            }
        }
        
        return this.constants;
    }

    get(...values: string[]|string[][]): any {
        if (!values || !Array.isArray(values) || values.length <= 0) return this.constants;

        let returnValue: any[] = [];
        let i = 0;
        for (let value of values) {
            if (Array.isArray(value)) {
                for (let value2 of value) {
                    if (!returnValue[i]) returnValue[i] = this.constants;

                    if (!returnValue[i].hasOwnProperty(value2)) {
                        returnValue[i] = null;
                        break;
                    }

                    returnValue[i] = returnValue[i][value2];
                }
            } else {
                if (!returnValue[0]) returnValue[0] = this.constants;

                if (!returnValue[0].hasOwnProperty(value)) {
                    returnValue[0] = null;
                    break;
                }

                returnValue[0] = returnValue[0][value];
            }

            i++;
        }

        if (returnValue.length <= 1) return returnValue[0];
        else return returnValue;
    }

    /* Injects a constant to a property */
    Inject(value): any {
        return (
            target: any,
            propertyKey: string,
        ) => {
            target[propertyKey] = value;

            Object.defineProperty(target, propertyKey, {
                configurable: false,
                value: value,
            });
        };
    }
    
    /* Declares a readonly ID which will be scoped and tied to the entire class */
    Scope(id: CommandIdentifier): any {
        return (
            target: any,
            propertyKey: string,
        ) => {
            target.IDAccessValueName = propertyKey;
            target[propertyKey] = id;

            Object.defineProperty(target, propertyKey, {
                configurable: false,
                value: id,
            });
        };
    }

    Metadata(metadata: CommandMetadata): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            let value: any;
            if (!descriptor["decoratedMetadata"]) descriptor["decoratedMetadata"] = value = metadata;
            else descriptor["decoratedMetadata"] = value = { ...descriptor["decoratedMetadata"], ...metadata } as CommandMetadata;

            Object.defineProperty(descriptor, "decoratedMetadata", {
                configurable: false,
                value: value,
            });
        };
    }

    Description(description: string): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            descriptor["decoratedDescription"] = description;

            Object.defineProperty(descriptor, "decoratedDescription", {
                configurable: false,
                value: description,
            });
        };
    }

    Apply(...hooks: (CommandFilter|EventFilter<any>|CommandInterceptor|EventInterceptor<any>|CommandConsumer|EventConsumer<any>)[]): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            for (let hook of hooks) {
                if (hook instanceof CommandFilter || hook instanceof EventFilter) this.Filter(hook)(target, propertyKey, descriptor);
                else if (hook instanceof CommandInterceptor || hook instanceof EventInterceptor) this.Interceptor(hook)(target, propertyKey, descriptor);
                else if (hook instanceof CommandConsumer || hook instanceof EventConsumer) this.Consumer(hook)(target, propertyKey, descriptor);
            }
        };
    }

    Filter(...filters: CommandFilter[]|EventFilter<any>[]): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            let value: any;
            if (!descriptor["decoratedFilters"]) descriptor["decoratedFilters"] = value = filters;
            else descriptor["decoratedFilters"] = value = descriptor["decoratedFilters"].concat(filters);

            Object.defineProperty(descriptor, "decoratedFilters", {
                configurable: true,
                enumerable: true,
                value: value,
            });

            return descriptor;
        };
    }

    Interceptor(...interceptors: CommandInterceptor[]|EventInterceptor<any>[]): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            let value: any;
            if (!descriptor["decoratedInterceptors"]) descriptor["decoratedInterceptors"] = value = interceptors;
            else descriptor["decoratedInterceptors"] = value = descriptor["decoratedInterceptors"].concat(interceptors);

            Object.defineProperty(descriptor, "decoratedInterceptors", {
                configurable: true,
                enumerable: true,
                value: value,
            });
        };
    }

    Consumer(...consumers: CommandConsumer[]|EventConsumer<any>[]): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            let value: any;
            if (!descriptor["decoratedConsumers"]) descriptor["decoratedConsumers"] = value = consumers;
            else descriptor["decoratedConsumers"] = value = descriptor["decoratedConsumers"].concat(consumers);

            Object.defineProperty(descriptor, "decoratedConsumers", {
                configurable: true,
                enumerable: true,
                value: value,
            });
        };
    }

    /* Fancy decorator to declare a bot command (basically syntactical sugar to Bot.addCommand) */
    Command(options?: CommandDecoratorOptions, useFunctionNameAsCommandName: boolean = true): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            Object.defineProperty(descriptor, "functionHandleType", {
                configurable: false,
                value: "command",
            });

            let commandNames: string[] = [];
            if (!!useFunctionNameAsCommandName) commandNames.push(propertyKey);
            else if (useFunctionNameAsCommandName === undefined && !propertyKey.startsWith("_")) commandNames.push(propertyKey);

            let filters: CommandFilter[] = [];
            let parser: CommandArgsParser|undefined;
            let interceptors: CommandInterceptor[] = [];
            let consumers: CommandConsumer[] = [];

            if (options) {
                if (options.names) {
                    if (typeof options.names === "string") commandNames.push(options.names);
                    else if (Array.isArray(options.names)) commandNames = commandNames.concat(options.names);
                }

                if (options.filters) {
                    if (Array.isArray(options.filters)) filters = options.filters;
                    else if (!Array.isArray(options.filters)) filters = [options.filters];
                }

                if (options.parser) parser = options.parser;

                if (options.interceptors) {
                    if (Array.isArray(options.interceptors)) interceptors = options.interceptors;
                    else if (!Array.isArray(options.interceptors)) interceptors = [options.interceptors];
                }

                if (options.consumers) {
                    if (Array.isArray(options.consumers)) consumers = options.consumers;
                    else if (!Array.isArray(options.consumers)) consumers = [options.consumers];
                }
            }

            if (descriptor) {
                if (descriptor["decoratedFilters"] && Array.isArray(descriptor["decoratedFilters"])) {
                    if (filters.length <= 0) filters = descriptor["decoratedFilters"];
                    else filters = filters.concat(descriptor["decoratedFilters"]);
                }

                if (descriptor["decoratedInterceptors"] && Array.isArray(descriptor["decoratedInterceptors"])) {
                    if (interceptors.length <= 0) interceptors = descriptor["decoratedInterceptors"];
                    else interceptors = interceptors.concat(descriptor["decoratedInterceptors"]);
                }

                if (descriptor["decoratedConsumers"] && Array.isArray(descriptor["decoratedConsumers"])) {
                    if (consumers.length <= 0) consumers = descriptor["decoratedConsumers"];
                    else consumers = consumers.concat(descriptor["decoratedConsumers"]);
                }
            }

            this.addCommand(new Command({
                id: !!options && !!options.id ? options.id : (target[target.IDAccessValueName] || undefined),
                names: commandNames,
                description: !!options && !!options.description ? options.description : (descriptor["decoratedDescription"] || undefined),
                filters: filters,
                parser: parser,
                interceptors: interceptors,
                consumers: consumers,
                metadata: !!options && !!options.metadata ? options.metadata : (descriptor["decoratedMetadata"] || undefined),
                methodName: propertyKey,
                handler: descriptor.value,
            } as CommandOptions));
        };
    }

    /* Translates to Event decorator */
    On(options?: EventDecoratorOptions, useFunctionNameAsEventType?: boolean): any {
        if (!options) options = { once: true };
        else Object.defineProperty(options, "once", {
            configurable: false,
            value: true,
        });

        return this.Event(options, useFunctionNameAsEventType);
    }

    /* Translates to Event decorator with { "once": true } */
    Once(options?: EventDecoratorOptions, useFunctionNameAsEventType?: boolean): any {
        return this.Event(options, useFunctionNameAsEventType);
    }

    /* Fancy decorator to declare a bot event (basically syntactical sugar to Bot.addEvent) */
    Event(options?: EventDecoratorOptions, useFunctionNameAsEventType?: boolean): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            Object.defineProperty(descriptor, "functionHandleType", {
                configurable: false,
                value: "event",
            });

            if (!options && useFunctionNameAsEventType === undefined) useFunctionNameAsEventType = true;
            else if (options && useFunctionNameAsEventType === undefined) useFunctionNameAsEventType = false;
            else useFunctionNameAsEventType = !!useFunctionNameAsEventType;

            let eventTypes: EventTypes[] = [];
            if (!!useFunctionNameAsEventType) eventTypes.push(propertyKey as EventTypes);
            else if (useFunctionNameAsEventType === undefined && !propertyKey.startsWith("_")) eventTypes.push(propertyKey as EventTypes);

            let filters: CommandFilter[] = [];
            let interceptors: CommandInterceptor[] = [];
            let consumers: CommandConsumer[] = [];

            if (options) {
                if (options.type) {
                    if (!Array.isArray(options.type)) eventTypes.push(options.type);
                    else eventTypes = eventTypes.concat(options.type);
                }
    
                if (options.filters) {
                    if (Array.isArray(options.filters)) filters = options.filters;
                    else if (!Array.isArray(options.filters)) filters = [options.filters];
                }

                if (options.interceptors) {
                    if (Array.isArray(options.interceptors)) interceptors = options.interceptors;
                    else if (!Array.isArray(options.interceptors)) interceptors = [options.interceptors];
                }

                if (options.consumers) {
                    if (Array.isArray(options.consumers)) consumers = options.consumers;
                    else if (!Array.isArray(options.consumers)) consumers = [options.consumers];
                }
            }

            if (descriptor) {
                if (descriptor["decoratedFilters"] && Array.isArray(descriptor["decoratedFilters"])) {
                    if (filters.length <= 0) filters = descriptor["decoratedFilters"];
                    else filters = filters.concat(descriptor["decoratedFilters"]);
                }

                if (descriptor["decoratedInterceptors"] && Array.isArray(descriptor["decoratedInterceptors"])) {
                    if (interceptors.length <= 0) interceptors = descriptor["decoratedInterceptors"];
                    else interceptors = interceptors.concat(descriptor["decoratedInterceptors"]);
                }

                if (descriptor["decoratedConsumers"] && Array.isArray(descriptor["decoratedConsumers"])) {
                    if (consumers.length <= 0) consumers = descriptor["decoratedConsumers"];
                    else consumers = consumers.concat(descriptor["decoratedConsumers"]);
                }
            }

            this.addEvent(new Event({
                id: !!options && !!options.id ? options.id : (target[target.IDAccessValueName] || undefined),
                type: eventTypes,
                filters: filters,
                interceptors: interceptors,
                consumers: consumers,
                methodName: propertyKey,
                handler: descriptor.value,
            } as EventOptions));
        };
    }

    Except(options: ExceptionInlineDecoratorOptions): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!target || !target["functionHandleType"]) return;
            else {
                switch(target["functionHandleType"]) {
                    case "command":
                        this.ExceptCommand(options);
                        break;
                    case "event":
                        this.ExceptEvent(options);
                        break;
                    default: break;
                }
            }
        };
    }

    ExceptCommand(options: ExceptionDecoratorOptions): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!options.id && (!Array.isArray(options.id) || options.id.length <= 0) && (!target.IDAccessValueName || !target[target.IDAccessValueName])) throw new ExceptionNoIDError(`Exception handler (${propertyKey}) must have an \`id\` property which specifies the command to handle. You can also use @Scope decorator.`);
            if (!options.id && target[target.IDAccessValueName]) options.id = target[target.IDAccessValueName];

            if (Array.isArray(options.id)) {
                for (let idV of options.id) {
                    if (typeof idV !== "number" && typeof idV !== "string") throw new ExceptionNoIDError(`One of exception handler (${propertyKey})'s \`id\`s is not valid or resolvable to a command id.`);

                    this.addCommandExceptionHandler({
                        id: idV,
                        exceptions: options.exceptions || undefined,
                        handler: descriptor.value,
                    } as ExceptionHandler);
                }
            } else {
                this.addCommandExceptionHandler({
                    id: options.id,
                    exceptions: options.exceptions || undefined,
                    handler: descriptor.value,
                } as ExceptionHandler);
            }
        };
    }

    ExceptEvent(options: ExceptionDecoratorOptions): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!options.id && (!Array.isArray(options.id) || options.id.length <= 0) && (!target.IDAccessValueName || !target[target.IDAccessValueName])) throw new ExceptionNoIDError(`Exception handler (${propertyKey}) must have an \`id\` property which specifies the event to handle. You can also use @Scope decorator.`);
            if (!options.id && target[target.IDAccessValueName]) options.id = target[target.IDAccessValueName];

            if (Array.isArray(options.id)) {
                for (let idV of options.id) {
                    if (typeof idV !== "number" && typeof idV !== "string") throw new ExceptionNoIDError(`One of exception handler (${propertyKey})'s \`id\`s is not valid or resolvable to an event id.`);

                    this.addEventExceptionHandler({
                        id: idV,
                        exceptions: options.exceptions || undefined,
                        handler: descriptor.value,
                    } as ExceptionHandler);
                }
            } else {
                this.addEventExceptionHandler({
                    id: options.id,
                    exceptions: options.exceptions || undefined,
                    handler: descriptor.value,
                } as ExceptionHandler);
            }
        };
    }

    Sandbox(): any {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            this.sandboxes.push(descriptor.value);
        };
    }
};