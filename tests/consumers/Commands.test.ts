import { LogConsumer, InlineCommandConsumer } from '../../consumers/Consumers';
import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { CommandConsumerResponse } from '../../classes/commands/CommandConsumer';
import { Client, Guild, Message, SnowflakeUtil, TextChannel, User } from 'discord.js';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

import shouldBeAConsumer from './ConsumerTestGenerics.test';

const testLog = "test log";

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));
const commandMock: Command = new Command({
    id: "test",
    names: "test",
    handler: sinon.fake(),
});
const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: [], arguments: [] } as CommandCallOptions;
const commandContextMock = { command: commandMock, message: messageMock, call: commandCallOptionsMock } as CommandContext;
const commandReturnDataMock = "return data by command test";

const consumerResponseMock = { next: true } as CommandConsumerResponse;

describe("Commands built-in consumers", function() {
    describe("LogConsumer", function() {
        shouldBeAConsumer(LogConsumer, [], [commandContextMock, commandReturnDataMock]);

        it("doesn't log if no custom text neither command or command name is provided", async function() {
            const logSpy = sinon.spy(console, 'log');

            const commandContextNoCommandMock = { message: messageMock, call: commandCallOptionsMock } as CommandContext;

            const consumer: LogConsumer = new LogConsumer();
            await consumer.consume(commandContextNoCommandMock, commandReturnDataMock);

            sinon.assert.notCalled(logSpy); // test is the first command name

            logSpy.restore();
        });

        it("log text defaults to a specific string describing the command", async function() {
            const logSpy = sinon.spy(console, 'log');

            const consumer: LogConsumer = new LogConsumer();
            await consumer.consume(commandContextMock, commandReturnDataMock);

            sinon.assert.calledWith(logSpy, `[COMMAND] test used.`); // test is the first command name

            logSpy.restore();
        });

        it("accepts and uses custom log text", async function() {
            const logSpy = sinon.spy(console, 'log');

            const consumer: LogConsumer = new LogConsumer(testLog);
            await consumer.consume(commandContextMock, commandReturnDataMock);

            sinon.assert.calledWith(logSpy, testLog);

            logSpy.restore();
        });

        it("accepts and uses custom log function", async function() {
            const logSpy = sinon.spy();

            const consumer: LogConsumer = new LogConsumer(testLog, logSpy);
            await consumer.consume(commandContextMock, commandReturnDataMock);

            sinon.assert.calledWith(logSpy, testLog);
        });
    });

    describe("InlineConsumer", function() {
        shouldBeAConsumer(InlineCommandConsumer, [sinon.stub().returns(consumerResponseMock)], [commandContextMock]);

        it("accepts and calls a callback with correct parameters", async function() {
            const callback = sinon.stub().returns(consumerResponseMock);
            const consumer: InlineCommandConsumer = new InlineCommandConsumer(callback);

            await consumer.consume(commandContextMock);

            sinon.assert.calledWith(callback, commandContextMock);
        });
    });
});