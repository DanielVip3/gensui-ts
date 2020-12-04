import { Client, GuildChannel, Message, TextChannel } from "discord.js";
import { ArgTypes, CommandArgs, DiscordArg, PrimitiveArg, ProcessorPayload } from "./CommandArgs";
import { CommandCallOptions } from "../CommandCallOptions";
import { types } from "joi";

const customTypes: {[key: string]: (value: string, message: Message) => any} = {};

export class CommandArgsParser {
    private readonly test: PrimitiveArg[]|DiscordArg[];

    constructor(...test: PrimitiveArg[]|DiscordArg[]) {
        this.test = test;
    }

    static addType(typeName: string, typeCaster: (value: string, message: Message) => any): boolean {
        customTypes[typeName] = typeCaster;

        return true;
    }

    static removeType(typeName: string): boolean {
        delete customTypes[typeName];

        return true;
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
            case "boolean":
                value = value.toLowerCase();
                if (value === "true" || value === "on" || value === "1" || value === "yes") return true;
                else if (value === "false" || value === "off" || value === "0" || value === "no") return false;
                else return null;

                
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
                if (type in customTypes) await customTypes[type](value, message);

                return null;
        }
    }

    async parse(message: Message, options: CommandCallOptions): Promise<CommandArgs> {
        const isValueValid = (value: any): boolean => value !== null && value !== undefined;

        async function getDefaultValue(type: PrimitiveArg|DiscordArg): Promise<any> {
            if (type.default) {
                if (type.default instanceof Function) {
                    const defaultR = await type.default(message, options);
                    return isValueValid(defaultR) ? defaultR : null;
                } else return isValueValid(type.default) ? type.default : null;
            } else return null;
        }

        let calledFrom: string[] = options.rawArguments;
        let args: CommandArgs = {};

        let i = 0;
        for (let type of this.test) {
            if (!type || !type.id || !type.id.length || type.id.length <= 0) continue;

            if (!calledFrom[i]) {
                args[type.id] = await getDefaultValue(type);
                continue;
            }

            let value: any = calledFrom[i];
            if (type.type) {
                if (Array.isArray(type.type)) {
                    for (let typeItem of type.type) {
                        if (!args[type.id]) {
                            const casted = await this.castType(value, typeItem, message);
                            args[type.id] = isValueValid(casted) ? casted : await getDefaultValue(type);
                        }
                    }
                } else {
                    const casted = await this.castType(value, type.type, message);
                    args[type.id] = isValueValid(casted) ? casted : await getDefaultValue(type);
                }
            } else args[type.id] = isValueValid(value) ? value : await getDefaultValue(type);

            if (type.processor) {
                if (Array.isArray(type.processor)) {
                    for (let processor of type.processor) {
                        if (processor) {
                            value = await processor({
                                originalValue: calledFrom[i],
                                value: args[type.id],
                                message,
                                type: type.type,
                                callOptions: options
                            } as ProcessorPayload);

                            if (type.type !== "boolean") {
                                if (value === false) args[type.id] = await getDefaultValue(type);
                                else if (value === true) continue;
                                else args[type.id] = isValueValid(value) ? value : await getDefaultValue(type);

                                continue;
                            } else {
                                args[type.id] = isValueValid(value) ? value : await getDefaultValue(type);

                                continue;
                            }
                        }
                    }
                } else {
                    value = await type.processor({
                        originalValue: calledFrom[i],
                        value: args[type.id],
                        message,
                        type: type.type,
                        callOptions: options
                    } as ProcessorPayload);

                    if (type.type !== "boolean") {
                        if (value === false) args[type.id] = await getDefaultValue(type);
                        else if (value === true) continue;
                        else args[type.id] = isValueValid(value) ? value : await getDefaultValue(type);

                        continue;
                    } else {
                        args[type.id] = isValueValid(value) ? value : await getDefaultValue(type);

                        continue;
                    }
                }
            }
            
            i++;
        }

        return args;
    }
};