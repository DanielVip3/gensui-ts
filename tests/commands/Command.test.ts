import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { Filters, InlineCommandFilter } from '../../filters/Filters';
import { Interceptors, InlineCommandInterceptor } from '../../interceptors/Interceptors';
import { Consumers, InlineCommandConsumer } from '../../consumers/Consumers';
import { CommandExceptionHandler } from '../../classes/exception-handler/CommandExceptionHandler';

import Bot from '../../classes/Bot';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as sinon from 'sinon';

const botMockID = new Bot({ // a bot mock to test repeating ids error
    name: "mock",
    token: "test-token",
    prefix: "!"
});

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: [], arguments: [] } as CommandCallOptions;
const commandContextMock = (command) => { return { command, message: messageMock, call: commandCallOptionsMock } as CommandContext };

describe("Command", function() {
    it("throws error if neither id and name were specified", function() {
        //@ts-ignore
        expect(() => new Command({
            handler: sinon.fake(),
        })).to.throw("id");
    });

    it("throws error with method name inside if neither id and name were specified and a methodName is specified", function() {
        //@ts-ignore
        expect(() => new Command({
            handler: sinon.fake(),
            methodName: "testName"
        })).to.throw("testName");
    });

    it("throws error if no name was specified", function() {
        //@ts-ignore
        expect(() => new Command({
            id: "test",
            handler: sinon.fake(),
        })).to.throw("name");
    });

    it("throws error if a command with the same id already exists", function() {
        const command = new Command({
            bot: botMockID,
            id: "test",
            names: "test",
            handler: sinon.fake(),
        });
        
        botMockID.addCommand(command);

        expect(() => new Command({
            bot: botMockID,
            id: "test",
            names: "test",
            handler: sinon.fake(),
        })).to.throw("id");
    });

    it("instantiates", function() {
        expect(new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        })).to.be.instanceOf(Command);
    });

    it("accepts single names", function() {
        expect(new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        })).to.have.property("names").and.to.be.an('array').and.to.have.lengthOf(1);
    });

    it("accepts multiple names", function() {
        expect(new Command({
            id: "test",
            names: ["test", "test2"],
            handler: sinon.fake(),
        })).to.have.property("names").and.to.be.an('array').and.to.have.lengthOf(2);
    });

    it("sets default id as the first name if no id was passed but names were", function() {
        expect(new Command({
            names: ["test"],
            handler: sinon.fake(),
        })).to.have.property("id", "test");
    });

    it("accepts description", function() {
        expect(new Command({
            names: ["test"],
            description: "testDescription",
            handler: sinon.fake(),
        })).to.have.property("description", "testDescription");
    });

    it("accepts metadata", function() {
        expect(new Command({
            names: ["test"],
            handler: sinon.fake(),
            metadata: { test: true },
        })).to.have.property("metadata").which.has.property("test", true);
    });

    it("accepts a different arguments divider (argumentsDivider)", function() {
        expect(new Command({
            names: ["test"],
            handler: sinon.fake(),
            argumentsDivider: " | ",
        })).to.have.property("argumentsDivider", " | ");
    });

    it("handler gets called correctly", async function() {
        const callback = sinon.spy();

        const command: Command = new Command({
            id: "test",
            names: ["test"],
            handler: callback,
        });

        await command.call(messageMock, commandCallOptionsMock);

        sinon.assert.calledWith(callback, commandContextMock(command)); // data was not set because like next test, data is not setted if no hook edits it
    });

    it("context data does not exist if no hooks do set it", async function() {
        const callback = sinon.spy();

        const command: Command = new Command({
            id: "test",
            names: ["test"],
            handler: callback,
        });

        await command.call(messageMock, commandCallOptionsMock);

        sinon.assert.calledWith(callback, sinon.match((value) => value["data"] === undefined)); // data was not set because it's not setted if no hook edits it
    });

    it("calls all hooks in order", async function() {
        const callbackFilter = sinon.stub().returns(true);
        const callbackInterceptor = sinon.stub().returns({ next: true });
        const callbackCommand = sinon.stub();
        const callbackConsumer = sinon.stub().throws(new SyntaxError("test"));
        const callbackExceptionHandler = sinon.stub();

        const filter: InlineCommandFilter = Filters.Commands.Inline(callbackFilter);
        const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(callbackInterceptor);
        const consumer: InlineCommandConsumer = Consumers.Commands.Inline(callbackConsumer);
        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const command: Command = new Command({
            id: "test",
            names: "test",
            filters: [filter],
            interceptors: [interceptor],
            consumers: [consumer],
            exceptions: [exceptionH],
            handler: callbackCommand,
        });

        await command.call(messageMock, commandCallOptionsMock);

        expect(callbackFilter.calledImmediatelyBefore(callbackInterceptor)).to.be.true;
        expect(callbackInterceptor.calledImmediatelyBefore(callbackCommand)).to.be.true;
        expect(callbackCommand.calledImmediatelyBefore(callbackConsumer)).to.be.true;
        expect(callbackConsumer.calledImmediatelyBefore(callbackExceptionHandler)).to.be.true;
        sinon.assert.calledOnce(callbackExceptionHandler);
    });
});