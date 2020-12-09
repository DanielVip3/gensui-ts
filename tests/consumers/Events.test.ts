import { InlineEventConsumer } from '../../consumers/Consumers';
import { Event, EventContext, EventPayload } from '../../classes/events/Event';
import { EventConsumerResponse } from '../../classes/events/EventConsumer';
import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

import shouldBeAConsumer from './ConsumerTestGenerics.test';

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));
const eventMock: Event = new Event({
    id: "test",
    type: "message",
    handler: sinon.fake(),
});

const eventPayloadMock = [messageMock] as EventPayload<"message">;
const eventContextMock = { event: eventMock } as EventContext;
const eventReturnDataMock = "return data by event test";

const consumerResponseMock = { next: true } as EventConsumerResponse;

describe("Events built-in consumers", function() {
    describe("InlineConsumer", function() {
        shouldBeAConsumer(InlineEventConsumer, [sinon.stub().returns(consumerResponseMock)], [eventPayloadMock, eventContextMock, eventReturnDataMock]);

        it("accepts and calls a callback with correct parameters", async function() {
            const callback = sinon.stub().returns(consumerResponseMock);
            const consumer: InlineEventConsumer<"message"> = new InlineEventConsumer(callback);

            await consumer.consume(eventPayloadMock, eventContextMock, eventReturnDataMock);

            sinon.assert.calledWith(callback, eventPayloadMock, eventContextMock, eventReturnDataMock);
        });
    });
});