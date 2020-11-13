import { CommandContext } from "../../classes/commands/Command";
import { CommandConsumer, CommandConsumerResponse } from "../../classes/commands/CommandConsumer";

export default class LogConsumer implements CommandConsumer {
    private readonly customText?: string;
    private readonly logFunction: Function = console.log;

    constructor(customText?: string, customLogFunction?: Function) {
        this.customText = customText;
        if (customLogFunction) this.logFunction = customLogFunction;
    }

    public consume(context: CommandContext, returnData: any): CommandConsumerResponse {
        if (this.customText) this.logFunction(this.customText);
        else if (context && context.command && context.command.names) this.logFunction(`[COMMAND] ${context.command.names[0]} used.`);

        return {
            next: true,
        };
    }
}