import byContract from "bycontract";

import { Message } from "discord.js";
import { CommandArgsValidator } from "../classes/commands/args/CommandArgsValidator";
import { CommandCallOptions } from "../classes/commands/CommandCallOptions";

export default class InlineValidator implements CommandArgsValidator {
    private readonly test: string;

    constructor(test: string) {
        this.test = test;
    }

    validate(message: Message, options: CommandCallOptions): boolean {
        byContract.validate(options.rawArguments, this.test.split(" "));

        return true;
    }
};