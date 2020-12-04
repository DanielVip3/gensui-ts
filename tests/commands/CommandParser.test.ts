import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { Filters, InlineCommandFilter } from '../../filters/Filters';
import { Interceptors, InlineCommandInterceptor } from '../../interceptors/Interceptors';

import Bot from '../../classes/Bot';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as sinon from 'sinon';
import { CommandArgsParser } from '../../classes/commands/args/CommandArgsParser';

const testRawArguments = ["test", "test1"];

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: testRawArguments } as CommandCallOptions;
const commandContextMock = (command) => { return { command, message: messageMock, call: commandCallOptionsMock } as CommandContext };

describe("CommandParser and Command's parser usage", function() {
    it("accepts a parser", function() {
        const parser: CommandArgsParser = new CommandArgsParser([{
            id: "test",
        }]);

        expect(new Command({
            id: "test",
            names: "test",
            parser: parser,
            handler: sinon.fake(),
        })).to.have.property("parser").and.to.be.equal(parser);
    });

    it("calls parser and returns raw arguments if no parser was passed", async function() {
        const command: Command = new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        });

        const response = await command.callParser(commandContextMock(command));

        /* raw arguments object is like an array, where "0" property is the first passed, "1" is the second and so on; in this case we have "0": "test" */

        expect(response).to.have.property("0", "test");
    });
});