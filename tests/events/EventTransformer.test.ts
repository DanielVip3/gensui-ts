import { Event, EventContext } from '../../classes/events/Event';

import shouldBeAConsumer from '../consumers/ConsumerTestGenerics';
import EventTransformerMock from '../mocks/EventTransformer.mock';

import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

const eventMock: Event = new Event({
    id: "test",
    type: "message",
    handler: sinon.fake(),
});
const eventContextMock = { event: eventMock } as EventContext;

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

describe("EventTransformer", function() {
    /* Due to the fact that EventTransformer(s) basically are just interceptors with default return data, if they're reconducible as Interceptors they don't need to re-do interceptors tests */
    it("can be traced back to an EventInterceptor", async function() {
        shouldBeAConsumer(EventTransformerMock, [sinon.spy(), false], [[messageMock], eventContextMock]);
    });

    it("transform method gets called correctly by the intercept method", async function() {
        const spy = sinon.spy();
        const transformer = new EventTransformerMock(spy, true);
        await transformer.intercept([messageMock], eventContextMock);

        sinon.assert.called(spy);
    });

    it("transforms event's context correctly", async function() {
        const spy = sinon.spy();
        const transformableEventContextMock = { event: eventMock } as EventContext;
        const transformer = new EventTransformerMock(spy, true);
        await transformer.intercept([messageMock], transformableEventContextMock);

        expect(transformableEventContextMock).to.have.property("testDone", true);
    });
});