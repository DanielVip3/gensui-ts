import { Message } from "discord.js";
import { Command } from "./Command";
import { CommandCallOptions } from "./CommandCallOptions";

export interface CommandContextData {
    [key: string]: any;
};

export interface CommandContext {
    command: Command,
    message: Message,
    data?: CommandContextData,
    call: CommandCallOptions,
};