import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';

import shouldBeAnInterceptor from '../interceptors/InterceptorTestGenerics';
import CommandTransformerMock from '../mocks/CommandTransformer.mock';

import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';
const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

const commandMock: Command = new Command({
    id: "test",
    names: "test",
    handler: sinon.fake(),
});
const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: [], arguments: [] } as CommandCallOptions;
const commandContextMock = { command: commandMock, message: messageMock, call: commandCallOptionsMock } as CommandContext;

describe("CommandTransformer", function() {
    /* Due to the fact that CommandTransformer(s) basically are just interceptors with default return data, they can be traced back to Interceptors */
    it("can be traced back to a CommandInterceptor", async function() {
        shouldBeAnInterceptor(CommandTransformerMock, [sinon.spy(), false], [commandContextMock]);
    });

    it("transform method gets called correctly by the intercept method", async function() {
        const spy = sinon.spy();
        const transformer = new CommandTransformerMock(spy, true);
        await transformer.intercept(commandContextMock);

        sinon.assert.called(spy);
    });

    it("transforms event's context correctly", async function() {
        const spy = sinon.spy();
        const transformableCommandContextMock = { command: commandMock, message: messageMock, call: commandCallOptionsMock } as CommandContext;
        const transformer = new CommandTransformerMock(spy, true);
        await transformer.intercept(transformableCommandContextMock);

        expect(transformableCommandContextMock).to.have.property("data").which.has.property("testDone", true);
    });
});