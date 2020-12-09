import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';

import shouldBeAConsumer from '../consumers/ConsumerTestGenerics.test';
import CommandSideEffectMock from '../mocks/CommandSideEffect.mock';

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

describe("CommandSideEffect", function() {
    /* Due to the fact that CommandSideEffect(s) basically are just consumers with default return data, they can be traced back to Consumers */
    it("can be traced back to a CommandConsumer", async function() {
        shouldBeAConsumer(CommandSideEffectMock, [sinon.spy(), false], [commandContextMock]);
    });

    it("effect method gets called correctly by the consume method", async function() {
        const spy = sinon.spy();
        const sideEffect = new CommandSideEffectMock(spy, true);
        await sideEffect.consume(commandContextMock);

        sinon.assert.called(spy);
    });

    it("edits event's context correctly", async function() {
        const spy = sinon.spy();
        const transformableCommandContextMock = { command: commandMock, message: messageMock, call: commandCallOptionsMock } as CommandContext;
        const sideEffect = new CommandSideEffectMock(spy, true);
        await sideEffect.consume(transformableCommandContextMock);

        expect(transformableCommandContextMock).to.have.property("data").which.has.property("testDone", true);
    });
});