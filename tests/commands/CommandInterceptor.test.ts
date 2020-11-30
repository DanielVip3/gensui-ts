import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { Interceptors, InlineCommandInterceptor } from '../../interceptors/Interceptors';
import { CommandInterceptorResponse } from '../../classes/commands/CommandInterceptor';

import Bot from '../../classes/Bot';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as sinon from 'sinon';

const botMockGlobals = new Bot({ // a bot mock to test global hooks
    name: "mock",
    token: "test-token",
    prefix: "!"
});

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: [], arguments: [] } as CommandCallOptions;
const commandContextMock = (command) => { return { command, message: messageMock, call: commandCallOptionsMock } as CommandContext };

describe("CommandInterceptor and Command's interceptor usage", function() {
    it("accepts interceptors", function() {
        const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(sinon.spy());

        expect(new Command({
            id: "test",
            names: "test",
            interceptors: [interceptor, interceptor],
            handler: sinon.fake(),
        })).to.have.property("interceptors").and.to.have.members([interceptor, interceptor]);

        expect(new Command({
            id: "test",
            names: "test",
            interceptors: interceptor,
            handler: sinon.fake(),
        })).to.have.property("interceptors").and.to.have.members([interceptor]);
    });

    it("accepts global filters", function() {
        const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(sinon.spy());

        botMockGlobals.addGlobalCommandInterceptor(interceptor);

        expect(new Command({
            bot: botMockGlobals,
            id: "test",
            names: "test",
            handler: sinon.fake(),
        })).to.have.property("interceptors").and.to.have.members([interceptor]);
    });

    it("calls interceptors and flow goes forward if no interceptor was passed", async function() {
        const command: Command = new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        });

        const response = await command.callInterceptors(commandContextMock(command));

        expect(response).to.be.ok;
        expect(response.next).to.be.true;
        expect(response.data).to.be.empty;
    });

    it("calls interceptors, in order, with correct parameters", async function() {
        const callback1 = sinon.stub().returns({ next: true });
        const callback2 = sinon.stub().returns({ next: true });

        const interceptor1: InlineCommandInterceptor = Interceptors.Commands.Inline(callback1);
        const interceptor2: InlineCommandInterceptor = Interceptors.Commands.Inline(callback2);

        const command: Command = new Command({
            id: "test",
            names: "test",
            interceptors: [interceptor1, interceptor2],
            handler: sinon.fake(),
        });

        await command.callInterceptors(commandContextMock(command));

        sinon.assert.calledWith(callback1, commandContextMock(command));
        sinon.assert.calledWith(callback2, commandContextMock(command));

        expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
    });

    it("stops flow to command handler if one returns next as false", async function() {
        const interceptorH = sinon.stub().returns({ next: false });
        const commandH = sinon.spy();

        const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(interceptorH);

        const command: Command = new Command({
            id: "test",
            names: "test",
            interceptors: [interceptor],
            handler: commandH,
        });

        await command.callInterceptors(commandContextMock(command));

        sinon.assert.calledWith(interceptorH, commandContextMock(command));
        sinon.assert.notCalled(commandH);
    });

    it("stops interceptors' flow if one returns next as false", async function() {
        const callback1 = sinon.stub().returns({ next: false });
        const callback2 = sinon.stub().returns({ next: true });

        const interceptor1: InlineCommandInterceptor = Interceptors.Commands.Inline(callback1);
        const interceptor2: InlineCommandInterceptor = Interceptors.Commands.Inline(callback2);

        const command: Command = new Command({
            id: "test",
            names: "test",
            interceptors: [interceptor1, interceptor2],
            handler: sinon.fake(),
        });

        await command.callInterceptors(commandContextMock(command));

        sinon.assert.calledWith(callback1, commandContextMock(command));
        sinon.assert.notCalled(callback2);
    });

    it("merges interceptors' returned data", async function() {
        const callback1 = sinon.stub().returns({ next: true, data: { foo: 1, bar: 1 } });
        const callback2 = sinon.stub().returns({ next: true, data: { foo: 2 } });

        const interceptor1: InlineCommandInterceptor = Interceptors.Commands.Inline(callback1);
        const interceptor2: InlineCommandInterceptor = Interceptors.Commands.Inline(callback2);

        const command: Command = new Command({
            id: "test",
            names: "test",
            interceptors: [interceptor1, interceptor2],
            handler: sinon.fake(),
        });

        const response: CommandInterceptorResponse = await command.callInterceptors(commandContextMock(command));

        expect(response.data).to.be.ok.and.to.include({ foo: 2, bar: 1 });
    });
});