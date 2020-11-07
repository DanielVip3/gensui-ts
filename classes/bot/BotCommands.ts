import { Message, Client } from 'discord.js';
import { ExceptionNoCommandError } from '../../errors';
import { Command, CommandIdentifier } from '../commands/Command';
import { ExceptionHandler } from './ExceptionHandler';

export default class BotCommands {
    protected prefixValue: string|string[] = "!";
    protected client: Client;
    protected enableMentionHandling: boolean = false;
    protected commands: Command[] = [];

    constructor(startingCommands?: Command|Command[]) {
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

    addExceptionHandler(exceptionHandler: ExceptionHandler): boolean {
        if (!exceptionHandler.id) return false;
        const command: Command|undefined = this.getCommand(exceptionHandler.id);
        if (!command) throw new ExceptionNoCommandError(`Exception handler (command ID ${exceptionHandler.id}) does not refer to an existing command ID. Could it be you declared the exception handler BEFORE the command itself?`);
        
        command.addExceptionHandler(exceptionHandler);

        return true;
    }

    addCommand(command: Command): Command {
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

    findCommand(keyword: string): Command|undefined {
        if (!keyword) return undefined;

        return this.commands.find(c => c.names.includes(keyword));
    }
    
    async handleCommandMessage(client: Client, message: Message): Promise<Command|undefined> {
        const firstWord: string = message.content.trim().split(" ")[0];

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

        if (startsWithPrefix) {
            const command: Command|undefined = await this.findCommand(firstWord.replace(actualCommandPrefix, ""));
            if (command && command.call) command.call(message);

            return command;
        } else if (this.enableMentionHandling && client && client.user && message.mentions && message.mentions.has(client.user.id) && message.content.startsWith(`<@${client.user.id}>`)) {
            const command: Command|undefined = await this.findCommand(firstWord.replace(`<@${client.user.id}> `, ""));
            if (command && command.call) command.call(message);

            return command;
        }

        return undefined;
    }

    startFetchingCommands(client: Client,
                                preHook?: Function,
                                postHook?: (command: Command|undefined) => any)
    : void {
        client.on("message", async(message: Message) => {
            if (preHook) preHook();

            const command: Command|undefined = await this.handleCommandMessage(client, message);

            if (postHook) postHook(command);
        });
    }
}