import Discord, { ClientEvents } from 'discord.js';
import * as yup from 'yup';

import BotCommands from './bot/BotCommands';
import BotConstants from './bot/BotConstants';
import { Command, CommandDecoratorOptions, CommandIdentifier, CommandMetadata, CommandOptions } from './commands/Command';
import { ExceptionNoIDError } from '../errors';
import { ExceptionDecoratorOptions, ExceptionHandler, ExceptionInlineDecoratorOptions } from './exception-handler/ExceptionHandler';
import { CommandFilter } from './commands/CommandFilter';
import { CommandInterceptor } from './commands/CommandInterceptor';
import { CommandConsumer } from './commands/CommandConsumer';
import { Event, EventDecoratorOptions, EventOptions, EventTypes } from './events/Event';
import { EventFilter } from './events/EventFilter';
import { EventInterceptor } from './events/EventInterceptor';
import { EventConsumer } from './events/EventConsumer';
import { Sandbox } from './sandboxes/Sandbox';

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
    public constants: BotConstants;
    private sandboxes: Sandbox[];

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

    get(...values: string[]): any {
        if (!values || !Array.isArray(values) || values.length <= 0) return this.constants;

        let returnValue = this.constants;
        for (let value of values) {
            if (!returnValue || !returnValue.hasOwnProperty(value)) break;

            returnValue = returnValue[value];
        }

        return returnValue;
    }

    /* Injects a constant to a property */
    Inject(value) {
        return (
            target: any,
            propertyKey: string,
        ) => {
            target[propertyKey] = value;

            Object.defineProperty(target, propertyKey, {
                configurable: false,
                get: () => value,
                set: (val) => {}
            });
        };
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
            if (!descriptor["decoratedMetadata"]) descriptor["decoratedMetadata"] = metadata;
            else descriptor["decoratedMetadata"] = { ...descriptor["decoratedMetadata"], ...metadata } as CommandMetadata;

            Object.defineProperty(descriptor, "decoratedMetadata", {
                configurable: false,
                get: () => descriptor["decoratedMetadata"],
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
            descriptor["decoratedDescription"] = description;

            Object.defineProperty(descriptor, "decoratedDescription", {
                configurable: false,
                get: () => descriptor["decoratedDescription"],
                set: (val) => {},
            });
        };
    }

    Apply(...hooks: (CommandFilter|EventFilter<any>|CommandInterceptor|EventInterceptor<any>|CommandConsumer|EventConsumer<any>)[]) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            for (let hook of hooks) {
                if (hook instanceof CommandFilter || hook instanceof EventFilter) this.Filter(...hook);
                else if (hook instanceof CommandInterceptor || hook instanceof EventInterceptor) this.Interceptor(...hook);
                else if (hook instanceof CommandConsumer || hook instanceof EventConsumer) this.Consumer(...hook);
            }
        };
    }

    Filter(...filters: CommandFilter[]|EventFilter<any>[]) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!descriptor["decoratedFilters"]) descriptor["decoratedFilters"] = filters;
            else descriptor["decoratedFilters"] = descriptor["decoratedFilters"].concat(filters);

            Object.defineProperty(descriptor, "decoratedFilters", {
                configurable: false,
                get: () => descriptor["decoratedFilters"],
                set: (val) => {},
            });
        };
    }

    Interceptor(...interceptors: CommandInterceptor[]|EventInterceptor<any>[]) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!descriptor["decoratedInterceptors"]) descriptor["decoratedInterceptors"] = interceptors;
            else descriptor["decoratedInterceptors"] = descriptor["decoratedInterceptors"].concat(interceptors);

            Object.defineProperty(descriptor, "decoratedInterceptors", {
                configurable: false,
                get: () => descriptor["decoratedInterceptors"],
                set: (val) => {},
            });
        };
    }

    Consumer(...consumers: CommandConsumer[]|EventConsumer<any>[]) {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            if (!descriptor["decoratedConsumers"]) descriptor["decoratedConsumers"] = consumers;
            else descriptor["decoratedConsumers"] = descriptor["decoratedConsumers"].concat(consumers);

            Object.defineProperty(descriptor, "decoratedConsumers", {
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
            Object.defineProperty(descriptor, "functionHandleType", {
                configurable: false,
                get: () => "command",
                set: (val) => {},
            });

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
            }

            this.addCommand(new Command({
                id: !!options && !!options.id ? options.id : (target[target.IDAccessValueName] || undefined),
                names: commandNames,
                description: !!options && !!options.description ? options.description : (descriptor["decoratedDescription"] || undefined),
                filters: filters,
                interceptors: interceptors,
                consumers: consumers,
                metadata: !!options && !!options.metadata ? options.metadata : (descriptor["decoratedMetadata"] || undefined),
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
            Object.defineProperty(descriptor, "functionHandleType", {
                configurable: false,
                get: () => "event",
                set: (val) => {},
            });

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

    Except(options: ExceptionInlineDecoratorOptions) {
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

    ExceptCommand(options: ExceptionDecoratorOptions) {
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

    ExceptEvent(options: ExceptionDecoratorOptions) {
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

    Sandbox() {
        return (
            target: any,
            propertyKey: string,
            descriptor: PropertyDescriptor
        ) => {
            this.sandboxes.push(descriptor.value);
        };
    }
};