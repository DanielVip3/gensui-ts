import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { Consumers, InlineCommandConsumer } from '../../consumers/Consumers';
import { CommandConsumerResponse } from '../../classes/commands/CommandConsumer';

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

describe("CommandConsumer and Command's consumer usage", function() {
    it("accepts consumers", function() {
        const consumer: InlineCommandConsumer = Consumers.Commands.Inline(sinon.spy());

        expect(new Command({
            id: "test",
            names: "test",
            consumers: [consumer, consumer],
            handler: sinon.fake(),
        })).to.have.property("consumers").and.to.have.members([consumer, consumer]);

        expect(new Command({
            id: "test",
            names: "test",
            consumers: consumer,
            handler: sinon.fake(),
        })).to.have.property("consumers").and.to.have.members([consumer]);
    });

    it("accepts global consumers", function() {
        const consumer: InlineCommandConsumer = Consumers.Commands.Inline(sinon.spy());

        botMockGlobals.addGlobalCommandConsumer(consumer);

        expect(new Command({
            bot: botMockGlobals,
            id: "test",
            names: "test",
            handler: sinon.fake(),
        })).to.have.property("consumers").and.to.have.members([consumer]);
    });

    it("calls consumers and flow goes forward if no consumer was passed", async function() {
        const command: Command = new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        });

        const response = await command.callConsumers(commandContextMock(command), "return data by command test");

        expect(response).to.be.ok;
        expect(response.next).to.be.true;
        expect(response.data).to.be.empty;
    });

    it("calls consumers, in order, with correct parameters", async function() {
        const callback1 = sinon.stub().returns({ next: true });
        const callback2 = sinon.stub().returns({ next: true });

        const consumer1: InlineCommandConsumer = Consumers.Commands.Inline(callback1);
        const consumer2: InlineCommandConsumer = Consumers.Commands.Inline(callback2);

        const command: Command = new Command({
            id: "test",
            names: "test",
            consumers: [consumer1, consumer2],
            handler: sinon.fake(),
        });

        await command.callConsumers(commandContextMock(command), "return data by command test");

        sinon.assert.calledWith(callback1, commandContextMock(command), "return data by command test");
        sinon.assert.calledWith(callback2, commandContextMock(command), "return data by command test");

        expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
    });

    it("stops consumers' flow if one returns next as false", async function() {
        const callback1 = sinon.stub().returns({ next: false });
        const callback2 = sinon.stub().returns({ next: true });

        const consumer1: InlineCommandConsumer = Consumers.Commands.Inline(callback1);
        const consumer2: InlineCommandConsumer = Consumers.Commands.Inline(callback2);

        const command: Command = new Command({
            id: "test",
            names: "test",
            consumers: [consumer1, consumer2],
            handler: sinon.fake(),
        });

        await command.callConsumers(commandContextMock(command), "return data by command test");

        sinon.assert.calledWith(callback1, commandContextMock(command), "return data by command test");
        sinon.assert.notCalled(callback2);
    });

    it("merges consumers' returned data", async function() {
        const callback1 = sinon.stub().returns({ next: true, data: { foo: 1, bar: 1 } });
        const callback2 = sinon.stub().returns({ next: true, data: { foo: 2 } });

        const consumer1: InlineCommandConsumer = Consumers.Commands.Inline(callback1);
        const consumer2: InlineCommandConsumer = Consumers.Commands.Inline(callback2);

        const command: Command = new Command({
            id: "test",
            names: "test",
            consumers: [consumer1, consumer2],
            handler: sinon.fake(),
        });

        const response: CommandConsumerResponse = await command.callConsumers(commandContextMock(command), "return data by command test");

        expect(response.data).to.be.ok.and.to.include({ foo: 2, bar: 1 });
    });

    it("receives command handler's return data", async function() {
        const testReturnData = { test: "object" };

        const consumerH = sinon.stub().returns({ next: true });
        const commandH = sinon.stub().returns(testReturnData);

        const consumer: InlineCommandConsumer = Consumers.Commands.Inline(consumerH);

        const command: Command = new Command({
            id: "test",
            names: "test",
            consumers: [consumer],
            handler: commandH,
        });

        await command.call(messageMock, commandCallOptionsMock);

        sinon.assert.calledWith(consumerH, commandContextMock(command), testReturnData);
    });
});