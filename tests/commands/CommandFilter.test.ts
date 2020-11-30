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

const botMockGlobals = new Bot({ // a bot mock to test global hooks
    name: "mock",
    token: "test-token",
    prefix: "!"
});

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: [], arguments: [] } as CommandCallOptions;
const commandContextMock = (command) => { return { command, message: messageMock, call: commandCallOptionsMock } as CommandContext };

describe("CommandFilter and Command's filter usage", function() {
    it("accepts filters", function() {
        const filter: InlineCommandFilter = Filters.Commands.Inline(sinon.spy());

        expect(new Command({
            id: "test",
            names: "test",
            filters: [filter, filter],
            handler: sinon.fake(),
        })).to.have.property("filters").and.to.have.members([filter, filter]);

        expect(new Command({
            id: "test",
            names: "test",
            filters: filter,
            handler: sinon.fake(),
        })).to.have.property("filters").and.to.have.members([filter]);
    });

    it("accepts global filters", function() {
        const filter: InlineCommandFilter = Filters.Commands.Inline(sinon.spy());

        botMockGlobals.addGlobalCommandFilter(filter);

        expect(new Command({
            bot: botMockGlobals,
            id: "test",
            names: "test",
            handler: sinon.fake(),
        })).to.have.property("filters").and.to.have.members([filter]);
    });

    it("calls filters and returns true if no filter was passed", async function() {
        const command: Command = new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        });

        const response = await command.callFilters(commandContextMock(command));

        expect(response).to.be.true;
    });

    it("calls filters, in order, with correct parameters", async function() {
        const callback1 = sinon.stub().returns(true);
        const callback2 = sinon.stub().returns(true);

        const filter1: InlineCommandFilter = Filters.Commands.Inline(callback1);
        const filter2: InlineCommandFilter = Filters.Commands.Inline(callback2);

        const command: Command = new Command({
            id: "test",
            names: "test",
            filters: [filter1, filter2],
            handler: sinon.fake(),
        });

        await command.callFilters(commandContextMock(command));

        sinon.assert.calledWith(callback1, commandContextMock(command));
        sinon.assert.calledWith(callback2, commandContextMock(command));

        expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
    });

    it("stops flow to interceptors if one returns false", async function() {
        const filterH = sinon.stub().returns(false);
        const interceptorH = sinon.stub();
        const commandH = sinon.spy();

        const filter: InlineCommandFilter = Filters.Commands.Inline(filterH);
        const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(interceptorH);

        const command: Command = new Command({
            id: "test",
            names: "test",
            filters: [filter],
            interceptors: [interceptor],
            handler: commandH,
        });

        await command.call(messageMock, commandCallOptionsMock);

        sinon.assert.calledWith(filterH, commandContextMock(command));
        sinon.assert.notCalled(interceptorH);
    });

    it("stops flow to command handler if one returns false", async function() {
        const filterH = sinon.stub().returns(false);
        const commandH = sinon.spy();

        const filter: InlineCommandFilter = Filters.Commands.Inline(filterH);

        const command: Command = new Command({
            id: "test",
            names: "test",
            filters: [filter],
            handler: commandH,
        });

        await command.call(messageMock, commandCallOptionsMock);

        sinon.assert.calledWith(filterH, commandContextMock(command));
        sinon.assert.notCalled(commandH);
    });
});