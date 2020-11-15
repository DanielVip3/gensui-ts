import { Message } from "discord.js";
import { CommandCallOptions } from "../CommandCallOptions";

export abstract class CommandArgsValidator {
    abstract validate(message: Message, options: CommandCallOptions): boolean;
};