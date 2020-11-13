import Discord from 'discord.js';
import * as yup from 'yup';

import BotCommands from './bot/BotCommands';
import { Command, CommandDecoratorOptions, CommandIdentifier, CommandMetadata, CommandOptions } from './commands/Command';
import { ExceptionNoIDError } from '../errors';
import { ExceptionDecoratorOptions, ExceptionHandler } from './exception-handler/ExceptionHandler';
import { CommandFilter } from './commands/CommandFilter';
import { CommandInterceptor } from './commands/CommandInterceptor';
import { CommandConsumer } from './commands/CommandConsumer';
import { Event, EventDecoratorOptions, EventOptions, EventTypes } from './events/Event';

/* I need to validate the options at runtime too so an interface isn't a good option - I opt to use a yup schema and then convert it to an interface automatically. */
const BotOptionsSchema = yup.object({
    name: yup.string()
            .strict(true)
            .required(),
    
    token: yup.string()
            .strict(true)
            .required(),

    owner: yup.lazy(value => {
        if (Array.isArray(value)) return yup.array().of(yup.string().strict(true)).default(undefined);
        else if (typeof value === "string") return yup.string().strict(true).default(undefined);
        else return yup.string().strict(true).notRequired();
    }),

    enableMentionHandling: yup.boolean()
                            .notRequired()
                            .default(false),

    prefix: yup.lazy(value => {
        if (Array.isArray(value)) return yup.array().of(yup.string().strict(true)).required();
        else if (typeof value === "string") return yup.string().strict(true).required();
        else return yup.string().strict(true).required();
    }),
}).required();

type BotOptions = yup.InferType<typeof BotOptionsSchema>;

export default class Bot extends BotCommands {
    protected errored: boolean = false;
    public readonly options: BotOptions;
    public client: Discord.Client;

    constructor(options: BotOptions, readyHandler?: Function) {
        super();

        try {
            this.options = BotOptionsSchema.validateSync(options);
            this.client = new Discord.Client();

            this.client.on('ready', () => {
                if (readyHandler && typeof readyHandler === "function") readyHandler();
            });

            if (this.options) {
                if (this.options.enableMentionHandling) this.enableMentionHandling = true;
                else this.enableMentionHandling = false;

                if (this.options.prefix) this.prefix = this.options.prefix;
            }
        } catch(err) {
            console.error(err);
            this.errored = true;
        }
    }

    login(token?: string): Promise<string|null> {
        if (this.errored) return new Promise(function(resolve, reject) { reject(null); });

        return this.client.login(token || this.options.token);
    }

    start(token?: string): boolean {
        if (this.errored) return false;

        try {
            this.login(token || this.options.token);
            this.startFetchingCommands(this.client);

            return true;
        } catch(err) {
            console.error(err);

            return false;
        }
    }
    
    /* Declares a readonly ID which will be scoped and tied to the entire class */
    Scope(id: CommandIdentifier) {
        return (
            target: any,
            propertyKey: string,
        ) => {
            target.IDAccessValueName = propertyKey;
            target[propertyKey] = id;

            Object.defineProperty(target, propertyKey, {
                configurable: false,
                get: () => id,
                set: (val) => {}
            });
        };
    }

    Metadata(metadata: CommandMetadata) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!target["decoratedMetadata"]) target["decoratedMetadata"] = metadata;
            else target["decoratedMetadata"] = { ...target["decoratedMetadata"], ...metadata } as CommandMetadata;

            Object.defineProperty(target, "decoratedMetadata", {
                configurable: false,
                get: () => target["decoratedMetadata"],
                set: (val) => {},
            });
        };
    }

    Description(description: string) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            target["decoratedDescription"] = description;

            Object.defineProperty(target, "decoratedDescription", {
                configurable: false,
                get: () => target["decoratedDescription"],
                set: (val) => {},
            });
        };
    }

    Filter(...filters: CommandFilter[]) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!target["decoratedFilters"]) target["decoratedFilters"] = filters;
            else target["decoratedFilters"] = target["decoratedFilters"].concat(filters);

            Object.defineProperty(target, "decoratedFilters", {
                configurable: false,
                get: () => target["decoratedFilters"],
                set: (val) => {},
            });
        };
    }

    Interceptor(...interceptors: CommandInterceptor[]) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!target["decoratedInterceptors"]) target["decoratedInterceptors"] = interceptors;
            else target["decoratedInterceptors"] = target["decoratedInterceptors"].concat(interceptors);

            Object.defineProperty(target, "decoratedInterceptors", {
                configurable: false,
                get: () => target["decoratedInterceptors"],
                set: (val) => {},
            });
        };
    }

    Consumer(...consumers: CommandConsumer[]) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!target["decoratedConsumers"]) target["decoratedConsumers"] = consumers;
            else target["decoratedConsumers"] = target["decoratedConsumers"].concat(consumers);

            Object.defineProperty(target, "decoratedConsumers", {
                configurable: false,
                get: () => target["decoratedConsumers"],
                set: (val) => {},
            });
        };
    }

    /* Fancy decorator to declare a bot command (basically syntactical sugar to Bot.addCommand) */
    Command(options?: CommandDecoratorOptions, useFunctionNameAsCommandName: boolean = true) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            let commandNames: string[] = [];
            if (!!useFunctionNameAsCommandName) commandNames.push(propertyKey);
            else if (useFunctionNameAsCommandName === undefined && !propertyKey.startsWith("_")) commandNames.push(propertyKey);

            let filters: CommandFilter[] = [];
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

                if (options.interceptors) {
                    if (Array.isArray(options.interceptors)) interceptors = options.interceptors;
                    else if (!Array.isArray(options.interceptors)) interceptors = [options.interceptors];
                }

                if (options.consumers) {
                    if (Array.isArray(options.consumers)) consumers = options.consumers;
                    else if (!Array.isArray(options.consumers)) consumers = [options.consumers];
                }

                if (target) {
                    if (target["decoratedFilters"] && Array.isArray(target["decoratedFilters"])) {
                        if (filters.length <= 0) filters = target["decoratedFilters"];
                        else filters = filters.concat(target["decoratedFilters"]);
                    }

                    if (target["decoratedInterceptors"] && Array.isArray(target["decoratedInterceptors"])) {
                        if (interceptors.length <= 0) interceptors = target["decoratedInterceptors"];
                        else interceptors = interceptors.concat(target["decoratedInterceptors"]);
                    }

                    if (target["decoratedConsumers"] && Array.isArray(target["decoratedConsumers"])) {
                        if (consumers.length <= 0) consumers = target["decoratedConsumers"];
                        else consumers = consumers.concat(target["decoratedConsumers"]);
                    }
                }
            }

            this.addCommand(new Command({
                id: !!options && !!options.id ? options.id : (target[target.IDAccessValueName] || undefined),
                names: commandNames,
                description: !!options && !!options.description ? options.description : (target["decoratedDescription"] || undefined),
                filters: filters,
                interceptors: interceptors,
                consumers: consumers,
                metadata: !!options && !!options.metadata ? options.metadata : (target["decoratedMetadata"] || undefined),
                methodName: propertyKey,
                handler: descriptor.value,
            } as CommandOptions));
        };
    }

    /* Translates to Event decorator */
    On(options?: EventDecoratorOptions, useFunctionNameAsEventType?: boolean) {
        if (!options) options = { once: true };
        else Object.defineProperty(options, "once", {
            configurable: false,
            get: () => true,
            set: (val) => val,
        });

        return this.Event(options, useFunctionNameAsEventType);
    }

    /* Translates to Event decorator with { "once": true } */
    Once(options?: EventDecoratorOptions, useFunctionNameAsEventType?: boolean) {
        return this.Event(options, useFunctionNameAsEventType);
    }

    /* Fancy decorator to declare a bot event (basically syntactical sugar to Bot.addEvent) */
    Event(options?: EventDecoratorOptions, useFunctionNameAsEventType?: boolean) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!options && useFunctionNameAsEventType === undefined) useFunctionNameAsEventType = true;
            else if (options && useFunctionNameAsEventType === undefined) useFunctionNameAsEventType = false;
            else useFunctionNameAsEventType = !!useFunctionNameAsEventType;

            let eventTypes: EventTypes[] = [];
            if (!!useFunctionNameAsEventType) eventTypes.push(propertyKey as EventTypes);
            else if (useFunctionNameAsEventType === undefined && !propertyKey.startsWith("_")) eventTypes.push(propertyKey as EventTypes);

            if (options) {
                if (options.type) {
                    if (!Array.isArray(options.type)) eventTypes.push(options.type);
                    else eventTypes = eventTypes.concat(options.type);
                }
            }

            this.addEvent(new Event({
                id: !!options && !!options.id ? options.id : (target[target.IDAccessValueName] || undefined),
                type: eventTypes,
                methodName: propertyKey,
                handler: descriptor.value,
            } as EventOptions));
        };
    }

    Except(options: ExceptionDecoratorOptions) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!options.id && (!Array.isArray(options.id) || options.id.length <= 0) && (!target.IDAccessValueName || !target[target.IDAccessValueName])) throw new ExceptionNoIDError(`Exception handler (${propertyKey}) must have an \`id\` property which specifies the command to handle. You can also use @Scope decorator.`);
            if (!options.id && target[target.IDAccessValueName]) options.id = target[target.IDAccessValueName];

            if (Array.isArray(options.id)) {
                for (let idV of options.id) {
                    if (typeof idV !== "number" && typeof idV !== "string") throw new ExceptionNoIDError(`One of exception handler (${propertyKey})'s \`id\`s is not valid or resolvable to a command ID.`);

                    this.addExceptionHandler({
                        id: idV,
                        exceptions: options.exceptions || undefined,
                        handler: descriptor.value,
                    } as ExceptionHandler);
                }
            } else {
                this.addExceptionHandler({
                    id: options.id,
                    exceptions: options.exceptions || undefined,
                    handler: descriptor.value,
                } as ExceptionHandler);
            }
        };
    }
};