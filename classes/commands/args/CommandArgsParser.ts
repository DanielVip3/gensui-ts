import { Client, GuildChannel, Message, TextChannel } from "discord.js";
import { CommandArgs } from "./CommandArgs";
import { CommandCallOptions } from "../CommandCallOptions";

export const PrimitiveTypes = {
    string: "string",
    char: "char",
    number: "number",
    int: "int",
    float: "float",
    url: "url",
    date: "date",
    color: "color"
} as const;

export const DiscordTypes = {
    user: "user",
    member: "member",
    channel: "channel",
    textChannel: "textChannel",
    voiceChannel: "voiceChannel",
    role: "role",
    emoji: "emoji",
    guild: "guild",
    message: "message",
    channelMessage: "channelMessage",
    guildMessage: "guildMessage",
    invite: "invite"
} as const;

export type ArgTypes = (typeof PrimitiveTypes)[keyof typeof PrimitiveTypes]|(typeof DiscordTypes)[keyof typeof DiscordTypes];

export interface PrimitiveArg {
    id: string,
    type?: (typeof PrimitiveTypes)[keyof typeof PrimitiveTypes],
    default?: any,
    transformer?: Function[]|Function,
};

export interface DiscordArg {
    id: string,
    type?: (typeof DiscordTypes)[keyof typeof DiscordTypes],
    default?: any,
    transformer?: Function[]|Function,
};

export class CommandArgsParser {
    private readonly test: PrimitiveArg[]|DiscordArg[];

    constructor(test: PrimitiveArg[]|DiscordArg[]) {
        this.test = test;
    }

    async castType(value: string, type: ArgTypes, message: Message, client?: Client): Promise<any> {
        if (!value) return null;

        switch(type) {
            case "string":
                return value.toString();
            case "number":
                return Number(value);
            case "int":
                return parseInt(value);
            case "float":
                return parseFloat(value);
            case "url":
                return new URL(value);
            case "date":
                const timestamp: number = Date.parse(value);
                if (isNaN(timestamp)) return null;

                return new Date(timestamp);
            case "color":
                const color: number = parseInt(value.replace("#", ""), 16);
                if (color < 0 || color > 0xFFFFFF || isNaN(color)) return null;

                return color;


            case "user":
                if (!client) return null;

                return client.users.fetch(value);
            case "member":
                if (!message || !message.guild) return null;

                return await message.guild.members.fetch(value);
            case "channel":
                if (!message || !message.guild) return null;

                return await message.guild.channels.resolve(value);
            case "textChannel":
                if (!message || !message.guild) return null;

                const tchannel: GuildChannel|null = await message.guild.channels.resolve(value);
                if (!tchannel || tchannel.type !== "text") return null;
                else return tchannel;
            case "voiceChannel":
                if (!message || !message.guild) return null;

                const vchannel: GuildChannel|null = await message.guild.channels.resolve(value);
                if (!vchannel || vchannel.type !== "voice") return null;
                else return vchannel;
            case "role":
                if (!message || !message.guild) return null;

                return await message.guild.roles.fetch(value);
            case "emoji":
                if (!message || !message.guild) return null;

                return await message.guild.emojis.resolveIdentifier(value);
            case "guild":
                if (!client) return null;

                return await client.guilds.fetch(value);
            case "message":
            case "channelMessage":
                if (!message || !message.channel) return null;

                return await message.channel.messages.fetch(value);
            case "guildMessage":
                if (!message || !message.guild) return null;

                for (const channel of message.guild.channels.cache.values()) {
                    if (channel.type !== 'text') continue;
                    try {
                        return await (channel as TextChannel).messages.fetch(value);
                    } catch (err) {
                        if (/^Invalid Form Body/.test(err.message)) return null;
                    }
                }

                return null;
            default:
                return null;
        }
    }

    async parse(message: Message, options: CommandCallOptions): Promise<CommandArgs> {
        let calledFrom: string[] = options.rawArguments;
        let args: CommandArgs = {};

        let i = 0;
        for (let type of this.test) {
            if (!type || !type.id || !type.id.length || type.id.length <= 0) continue;

            if (!calledFrom[i]) {
                if (type.default) {
                    args[type.id] = type.default;
                    continue;
                } else args[type.id] = null;
            }

            let transformedValue: any = calledFrom[i];
            if (type.transformer) {
                if (Array.isArray(type.transformer)) {
                    for (let transformer of type.transformer) {
                        if (transformer) transformedValue = await transformer(transformedValue);
                    }
                } else transformedValue = await type.transformer(transformedValue);
            }

            if (type.type) args[type.id] = await this.castType(transformedValue, type.type, message) || type.default || null;
            
            i++;
        }

        return args;
    }
};