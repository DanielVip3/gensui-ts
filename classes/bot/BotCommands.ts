import { Message, Client } from 'discord.js';
import { ExceptionNoReferenceError } from '../../errors';
import { CommandGlobalHookError } from '../../errors/bot';
import { Command, CommandIdentifier } from '../commands/Command';
import { CommandConsumer } from '../commands/CommandConsumer';
import { CommandFilter } from '../commands/CommandFilter';
import { CommandInterceptor } from '../commands/CommandInterceptor';
import { CommandCallOptions } from '../commands/CommandCallOptions';
import { Event, EventContext, EventPayload } from '../events/Event';
import { ExceptionHandler } from '../exception-handler/ExceptionHandler';
import BotEvents from './BotEvents';

export default class BotCommands extends BotEvents {
    protected prefixValue: string|string[] = "!";
    protected enableMentionHandling: boolean = false;
    protected commands: Command[] = [];
    public readonly globalCommandFilters: CommandFilter[] = [];
    public readonly globalCommandInterceptors: CommandInterceptor[] = [];
    public readonly globalCommandConsumers: CommandConsumer[] = [];

    constructor(startingCommands?: Command|Command[]) {
        super();

        if (startingCommands) {
            if (Array.isArray(startingCommands)) this.commands = this.commands.concat(startingCommands);
            else this.commands.push(startingCommands);
        }
    }
    
    protected get prefix(): string|string[] {
        return this.prefixValue;
    }

    protected set prefix(prefix: string|string[]) {
        this.prefixValue = prefix;
    }

    protected get mentionHandling(): boolean {
        return this.enableMentionHandling;
    }

    protected set mentionHandling(enabled: boolean) {
        this.enableMentionHandling = enabled;
    }

    addGlobalCommandFilter(filter: CommandFilter): boolean {
        if (this.commands && Array.isArray(this.commands) && this.commands.length >= 1) throw new CommandGlobalHookError("Global filter(s) must be added before creating any command.");

        this.globalCommandFilters.push(filter);

        return true;
    }

    addGlobalCommandInterceptor(interceptor: CommandInterceptor): boolean {
        if (this.commands && Array.isArray(this.commands) && this.commands.length >= 1) throw new CommandGlobalHookError("Global interceptor(s) must be added before creating any command.");

        this.globalCommandInterceptors.push(interceptor);

        return true;
    }

    addGlobalCommandConsumer(consumer: CommandConsumer): boolean {
        if (this.commands && Array.isArray(this.commands) && this.commands.length >= 1) throw new CommandGlobalHookError("Global consumer(s) must be added before creating any command.");

        this.globalCommandConsumers.push(consumer);

        return true;
    }

    addCommandExceptionHandler(exceptionHandler: ExceptionHandler): boolean {
        if (!exceptionHandler.id) return false;
        const command: Command|undefined = this.getCommand(exceptionHandler.id);
        if (!command) throw new ExceptionNoReferenceError(`Exception handler (command ID ${exceptionHandler.id}) does not refer to an existing command ID. Could it be you declared the exception handler BEFORE the command itself?`);
        
        command.addExceptionHandler(exceptionHandler);

        return true;
    }

    addCommand(command: Command): Command {
        if (!command.bot) command.bot = this;

        this.commands.push(command);

        return command;
    }

    removeCommand(commandId: CommandIdentifier): Command {
        const commandIndex: number = this.commands.findIndex(c => c.id === commandId);
        const command: Command = this.commands[commandIndex];

        this.commands.splice(commandIndex, 1);

        return command;
    }

    getCommand(commandId: CommandIdentifier): Command|undefined {
        return this.commands.find(c => c.id === commandId);
    }

    getAllCommands(): Command[] {
        return this.commands;
    }

    findCommand(keyword: string): Command|undefined {
        if (!keyword) return undefined;

        return this.commands.find(c => c.names.includes(keyword));
    }
    
    async handleCommandMessage(client: Client, message: Message): Promise<Command|undefined> {
        let args: string[] = message.content.trim().split(" ");
        const firstWord: string = args[0];

        let startsWithPrefix: boolean = false;
        let actualCommandPrefix: string = "";
        if (typeof this.prefix === "string") {
            startsWithPrefix = firstWord.startsWith(this.prefix);
            actualCommandPrefix = this.prefix;
        } else if (Array.isArray(this.prefix)) {
            for (let prefix of this.prefix) {
                if (firstWord.startsWith(prefix)) {
                    startsWithPrefix = true;
                    actualCommandPrefix = prefix;

                    break;
                }
            }
        }

        let calledName: string|undefined = undefined;
        let mentionHandled: boolean = false;
        let command: Command|undefined;
        let callOptions: CommandCallOptions|undefined;
        if (startsWithPrefix) {
            command = await this.findCommand(firstWord.replace(actualCommandPrefix, ""));

            calledName = firstWord.replace(actualCommandPrefix, "");
            mentionHandled = false;
        } else if (this.enableMentionHandling && client && client.user && message.mentions && message.mentions.users.has(client.user.id) && (message.content.startsWith(`<@${client.user.id}>`) || message.content.startsWith(`<@!${client.user.id}>`))) {            
            command = await this.findCommand(message.content.replace(`<@${client.user.id}> `, "").replace(`<@!${client.user.id}> `, ""));

            calledName = firstWord.replace(`<@${client.user.id}> `, "").replace(`<@!${client.user.id}> `, "");
            mentionHandled = true;
        }

        if (command && calledName) {
            if (mentionHandled) {
                if (command.argumentsDivider && command.argumentsDivider !== " ") args = message.content.trim().split(" ");
                args.shift(); // removes the tag to the bot
                args.shift(); // removes the command name who called the command
            } else {
                if (command.argumentsDivider && command.argumentsDivider !== " ") args = message.content.trim().split(command.argumentsDivider);
                args.shift(); // removes the command name who called the command
            }

            callOptions = {
                prefix: actualCommandPrefix,
                name: calledName,
                mentionHandled,
                rawArguments: args,
            } as CommandCallOptions;
        }

        if (command && command.call && callOptions) {
            command.call(message, callOptions);

            return command;
        }

        return undefined;
    }

    startFetchingCommands(client: Client,
                                preHook?: Function,
                                postHook?: (command: Command|undefined) => any)
    : void {
        this.addEvent(new Event({
            id: "internal-commands-event",
            type: "message",
            handler: async([message]: EventPayload<"message">, { event, data }: EventContext) => {
                if (preHook) preHook();
    
                const command: Command|undefined = await this.handleCommandMessage(client, message);
    
                if (postHook) postHook(command);
            },
        }));
    }
}