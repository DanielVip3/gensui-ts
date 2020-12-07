import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { Filters, InlineCommandFilter } from '../../filters/Filters';
import { Interceptors, InlineCommandInterceptor } from '../../interceptors/Interceptors';
import { Consumers, InlineCommandConsumer } from '../../consumers/Consumers';
import { CommandExceptionHandler } from '../../classes/exception-handler/CommandExceptionHandler';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as sinon from 'sinon';
import { CommandArgsParser } from '../../classes/commands/args/CommandArgsParser';

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: ["test"], arguments: [] } as CommandCallOptions;
const commandContextMock = (command) => { return { command, message: messageMock, call: commandCallOptionsMock } as CommandContext };

describe("CommandExceptionHandler and Command's exception handlers usage", function() {
    it("accepts exception handlers in constructor", function() {
        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [],
            handler: sinon.spy()
        };
        
        expect(new Command({
            id: "test",
            names: "test",
            exceptions: [exceptionH, exceptionH],
            handler: sinon.fake(),
        })).to.have.property("exceptions").and.to.have.members([exceptionH, exceptionH]);

        expect(new Command({
            id: "test",
            names: "test",
            exceptions: exceptionH,
            handler: sinon.fake(),
        })).to.have.property("exceptions").and.to.have.members([exceptionH]);
    });
    
    it("accepts exception handlers post-declaration", function() {
        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [],
            handler: sinon.spy()
        };

        const command: Command = new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        });

        command.addExceptionHandler(exceptionH);
        command.addExceptionHandler(exceptionH);
        
        expect(command).to.have.property("exceptions").and.to.have.members([exceptionH, exceptionH]);
    });

    it("exception handlers function in post-declaration returns false if no exception handler is passed", async function() {
        const command: Command = new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        });

        //@ts-ignore
        const response = command.addExceptionHandler();
        
        expect(response).to.be.false;
    });

    it("calls exception handlers and returns false if no exception handler was passed", async function() {
        const command: Command = new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        });

        const response = await command.callExceptionHandlers(commandContextMock(command), SyntaxError);

        expect(response).to.be.false;
    });

    it("calls exception handlers and returns false if no valid exception handler for the type was passed", async function() {
        const command: Command = new Command({
            id: "test",
            names: "test",
            //@ts-ignore
            exceptions: [1], // putting a number as an exception handler makes it invalid
            handler: sinon.fake(),
        });

        const response = await command.callExceptionHandlers(commandContextMock(command), SyntaxError);

        expect(response).to.be.false;
    });

    it("calls exception handlers and returns false if no valid exception handler for the error was passed", async function() {
        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [TypeError],
            handler: sinon.spy(),
        };

        const command: Command = new Command({
            id: "test",
            names: "test",
            exceptions: [exceptionH],
            handler: sinon.fake(),
        });

        const response = await command.callExceptionHandlers(commandContextMock(command), SyntaxError);

        expect(response).to.be.false;
    });

    it("calls exception handlers and returns false if no valid exception was passed", async function() {
        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [TypeError],
            handler: sinon.spy(),
        };

        const command: Command = new Command({
            id: "test",
            names: "test",
            exceptions: [exceptionH],
            handler: sinon.fake(),
        });

        const response = await command.callExceptionHandlers(commandContextMock(command), 1);

        expect(response).to.be.false;
    });

    it("calls exception handlers with correct parameters", async function() {
        const callback = sinon.spy();

        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callback,
        };

        const command: Command = new Command({
            id: "test",
            names: "test",
            exceptions: [exceptionH],
            handler: sinon.fake(),
        });

        const context = commandContextMock(command);
        const error = new SyntaxError("test");
        await command.callExceptionHandlers(context, error);

        sinon.assert.calledWith(callback, context, error);
    });

    it("calls correct exception handlers for specified errors", async function() {
        const callback = sinon.spy();

        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callback,
        };

        const command: Command = new Command({
            id: "test",
            names: "test",
            exceptions: [exceptionH],
            handler: sinon.fake(),
        });

        await command.callExceptionHandlers(commandContextMock(command), SyntaxError);
        await command.callExceptionHandlers(commandContextMock(command), TypeError);

        sinon.assert.calledOnce(callback); // Once because we want the exception handler to be called only on the first SyntaxError, not on the TypeError
    });

    it("calls multiple exception handlers in order", async function() {
        const callback1 = sinon.spy();
        const callback2 = sinon.spy();

        const exceptionH1: CommandExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callback1,
        };

        const exceptionH2: CommandExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callback2,
        };

        const command: Command = new Command({
            id: "test",
            names: "test",
            exceptions: [exceptionH1, exceptionH2],
            handler: sinon.fake(),
        });

        await command.callExceptionHandlers(commandContextMock(command), SyntaxError);

        expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
    });

    it("calls exception handlers when command handlers do have an error", async function() {
        const callbackExceptionHandler = sinon.spy();
        const callbackCommand = sinon.stub().throws(new SyntaxError("test"));

        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const command: Command = new Command({
            id: "test",
            names: "test",
            exceptions: [exceptionH],
            handler: callbackCommand,
        });

        await command.call(messageMock, commandCallOptionsMock);

        sinon.assert.calledOnce(callbackExceptionHandler);
    });

    it("calls exception handlers when filters do have an error", async function() {
        const callbackExceptionHandler = sinon.spy();
        const callbackFilter = sinon.stub().throws(new SyntaxError("test"));

        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const filter: InlineCommandFilter = Filters.Commands.Inline(callbackFilter);

        const command: Command = new Command({
            id: "test",
            names: "test",
            exceptions: [exceptionH],
            filters: [filter],
            handler: sinon.fake(),
        });

        await command.callFilters(commandContextMock(command));

        sinon.assert.calledOnce(callbackExceptionHandler);
    });

    it("calls exception handlers when interceptors do have an error", async function() {
        const callbackExceptionHandler = sinon.spy();
        const callbackInterceptor = sinon.stub().throws(new SyntaxError("test"));

        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(callbackInterceptor);

        const command: Command = new Command({
            id: "test",
            names: "test",
            exceptions: [exceptionH],
            interceptors: [interceptor],
            handler: sinon.fake(),
        });

        await command.callInterceptors(commandContextMock(command));

        sinon.assert.calledOnce(callbackExceptionHandler);
    });

    it("calls exception handlers when consumers do have an error", async function() {
        const callbackExceptionHandler = sinon.spy();
        const callbackConsumer = sinon.stub().throws(new SyntaxError("test"));

        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const consumer: InlineCommandConsumer = Consumers.Commands.Inline(callbackConsumer);

        const command: Command = new Command({
            id: "test",
            names: "test",
            exceptions: [exceptionH],
            consumers: [consumer],
            handler: sinon.fake(),
        });

        await command.callConsumers(commandContextMock(command), "return data by command test");

        sinon.assert.calledOnce(callbackExceptionHandler);
    });

    it("calls exception handlers when the args parser does have an error", async function() {
        const callbackExceptionHandler = sinon.spy();
        const callbackTypeCasting = sinon.stub().throws(new SyntaxError("test"));

        const exceptionH: CommandExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const parser: CommandArgsParser = new CommandArgsParser({
            id: "arg1",
            type: callbackTypeCasting,
        });

        const command: Command = new Command({
            id: "test",
            names: "test",
            parser: parser,
            exceptions: [exceptionH],
            handler: sinon.fake(),
        });

        await command.callParser(commandContextMock(command));

        sinon.assert.calledOnce(callbackExceptionHandler);
    });
});