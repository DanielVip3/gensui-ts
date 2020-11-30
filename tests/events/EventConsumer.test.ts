import { Event, EventContext, EventPayload } from '../../classes/events/Event';
import { Consumers, InlineEventConsumer } from '../../consumers/Consumers';
import { EventConsumerResponse } from '../../classes/events/EventConsumer';

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

describe("EventConsumer and Event's consumer usage", function() {
    it("accepts consumers", function() {
        const consumer: InlineEventConsumer<"message"> = Consumers.Events.Inline(sinon.spy());

        expect(new Event({
            id: "test",
            type: "message",
            consumers: [consumer, consumer],
            handler: sinon.fake(),
        })).to.have.property("consumers").and.to.have.members([consumer, consumer]);

        expect(new Event({
            id: "test",
            type: "message",
            consumers: consumer,
            handler: sinon.fake(),
        })).to.have.property("consumers").and.to.have.members([consumer]);
    });

    it("accepts global consumers", function() {
        const consumer: InlineEventConsumer<"message"> = Consumers.Events.Inline(sinon.spy());

        botMockGlobals.addGlobalEventConsumer(consumer);

        expect(new Event({
            bot: botMockGlobals,
            id: "test",
            type: "message",
            handler: sinon.fake(),
        })).to.have.property("consumers").and.to.have.members([consumer]);
    });

    it("calls consumers and flow goes forward if no consumer was passed", async function() {
        const event: Event = new Event({
            id: "test",
            type: "message",
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        const returnData = "return data by event test";
        const response = await event.callConsumers(payload, context, returnData);

        expect(response).to.be.ok;
        expect(response.next).to.be.true;
        expect(response.data).to.be.empty;
    });

    it("calls consumers, in order, with correct parameters", async function() {
        const callback1 = sinon.stub().returns({ next: true });
        const callback2 = sinon.stub().returns({ next: true });

        const consumer1: InlineEventConsumer<"message"> = Consumers.Events.Inline(callback1);
        const consumer2: InlineEventConsumer<"message"> = Consumers.Events.Inline(callback2);

        const event: Event = new Event({
            id: "test",
            type: "message",
            consumers: [consumer1, consumer2],
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        const returnData = "return data by event test";
        await event.callConsumers(payload, context, returnData);

        sinon.assert.calledWith(callback1, payload, context, returnData);
        sinon.assert.calledWith(callback2, payload, context, returnData);

        expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
    });

    it("stops consumers' flow if one returns next as false", async function() {
        const callback1 = sinon.stub().returns({ next: false });
        const callback2 = sinon.stub().returns({ next: true });

        const consumer1: InlineEventConsumer<"message"> = Consumers.Events.Inline(callback1);
        const consumer2: InlineEventConsumer<"message"> = Consumers.Events.Inline(callback2);

        const event: Event = new Event({
            id: "test",
            type: "message",
            consumers: [consumer1, consumer2],
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        const returnData = "return data by event test";
        await event.callConsumers(payload, context, returnData);

        sinon.assert.calledWith(callback1, payload, context);
        sinon.assert.notCalled(callback2);
    });

    it("merges consumers' returned data", async function() {
        const callback1 = sinon.stub().returns({ next: true, data: { foo: 1, bar: 1 } });
        const callback2 = sinon.stub().returns({ next: true, data: { foo: 2 } });

        const consumer1: InlineEventConsumer<"message"> = Consumers.Events.Inline(callback1);
        const consumer2: InlineEventConsumer<"message"> = Consumers.Events.Inline(callback2);

        const event: Event = new Event({
            id: "test",
            type: "message",
            consumers: [consumer1, consumer2],
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        const returnData = "return data by event test";
        const response: EventConsumerResponse = await event.callConsumers(payload, context, returnData);

        expect(response.data).to.be.ok.and.to.include({ foo: 2, bar: 1 });
    });

    it("receives event handler's return data", async function() {
        const testReturnData = { test: "object" };

        const consumerH = sinon.stub().returns({ next: true });
        const eventH = sinon.stub().returns(testReturnData);

        const consumer: InlineEventConsumer<"message"> = Consumers.Events.Inline(consumerH);

        const event: Event = new Event({
            id: "test",
            type: "message",
            consumers: [consumer],
            handler: eventH,
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        await event.call(messageMock);

        sinon.assert.calledWith(consumerH, payload, context, testReturnData);
    });
});