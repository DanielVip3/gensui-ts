import Discord from 'discord.js';
import * as yup from 'yup';

import BotCommands from './bot/BotCommands';
import { Command, CommandDecoratorOptions, CommandIdentifier, CommandOptions } from './commands/Command';
import { ExceptionNoIDError } from '../errors';
import { ExceptionDecoratorOptions, ExceptionHandler } from './exception-handler/ExceptionHandler';
import { CommandFilter } from './commands/CommandFilter';
import { CommandInterceptorGeneric } from './commands/CommandInterceptor';
import { CommandConsumerGeneric } from './commands/CommandConsumer';

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
            let interceptors: CommandInterceptorGeneric[] = [];
            let consumers: CommandConsumerGeneric[] = [];

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
            }

            this.addCommand(new Command({
                id: !!options && !!options.id ? options.id : (target[target.IDAccessValueName] || undefined),
                names: commandNames,
                methodName: propertyKey,
                filters: filters,
                interceptors: interceptors,
                consumers: consumers,
                handler: descriptor.value,
            } as CommandOptions));
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