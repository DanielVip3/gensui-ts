import { Message } from "discord.js";
import { CommandCallOptions } from "../CommandCallOptions";

export interface CommandArgs {
    [key: string]: any,
};

export const PrimitiveTypes = {
    string: "string",
    char: "char",
    number: "number",
    int: "int",
    float: "float",
    whole: "whole",
    wholeNumber: "wholeNumber",
    decimal: "decimal",
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

export type ArgTypes = (typeof PrimitiveTypes)[keyof typeof PrimitiveTypes]|(typeof DiscordTypes)[keyof typeof DiscordTypes]|string;

export interface PrimitiveArg {
    id: string,
    type?: (typeof PrimitiveTypes)[keyof typeof PrimitiveTypes]|(typeof PrimitiveTypes)[keyof typeof PrimitiveTypes][]|string,
    default?: any|((message: Message, callOptions?: CommandCallOptions) => any),
    processor?: Processor[]|Processor|InlineProcessor[]|InlineProcessor,
};

export interface DiscordArg {
    id: string,
    type?: (typeof DiscordTypes)[keyof typeof DiscordTypes]|(typeof DiscordTypes)[keyof typeof DiscordTypes][]|string,
    default?: any|((message: Message, callOptions?: CommandCallOptions) => any),
    processor?: Processor[]|Processor|InlineProcessor[]|InlineProcessor,
};

export interface ProcessorPayload {
    originalValue: string,

    value: any,

    message: Message,

    type: ArgTypes,

    callOptions?: CommandCallOptions,
};

export type InlineProcessor = (payload: ProcessorPayload) => boolean|Promise<boolean>;
export type Processor = (payload: ProcessorPayload) => any|Promise<any>;
