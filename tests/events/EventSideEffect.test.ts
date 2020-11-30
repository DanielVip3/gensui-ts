import { Event, EventContext } from '../../classes/events/Event';

import shouldBeAConsumer from '../consumers/ConsumerTestGenerics';
import EventSideEffectMock from '../mocks/EventSideEffect.mock';

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

describe("EventSideEffect", function() {
    /* Due to the fact that EventSideEffect(s) basically are just consumers with default return data, if they're reconducible as Consumers they don't need to re-do consumers tests */
    it("can be traced back to an EventConsumer", async function() {
        shouldBeAConsumer(EventSideEffectMock, [sinon.spy(), false], [[messageMock], eventContextMock]);
    });

    it("effect method gets called correctly by the consume method", async function() {
        const spy = sinon.spy();
        const sideEffect = new EventSideEffectMock(spy, true);
        await sideEffect.consume([messageMock], eventContextMock);

        sinon.assert.called(spy);
    });

    it("edits event's context correctly", async function() {
        const spy = sinon.spy();
        const transformableEventContextMock = { event: eventMock } as EventContext;
        const sideEffect = new EventSideEffectMock(spy, true);
        await sideEffect.effect([messageMock], transformableEventContextMock);

        expect(transformableEventContextMock).to.have.property("data").which.has.property("testDone", true);
    });
});