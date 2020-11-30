import { Event, EventContext, EventPayload } from '../../classes/events/Event';
import { Filters, InlineEventFilter } from '../../filters/Filters';
import { Interceptors, InlineEventInterceptor } from '../../interceptors/Interceptors';

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

describe("EventFilter and Event's filter usage", function() {
    it("accepts filters", function() {
        const filter: InlineEventFilter<"message"> = Filters.Events.Inline(sinon.spy());

        expect(new Event({
            id: "test",
            type: "message",
            filters: [filter, filter],
            handler: sinon.fake(),
        })).to.have.property("filters").and.to.have.members([filter, filter]);

        expect(new Event({
            id: "test",
            type: "message",
            filters: filter,
            handler: sinon.fake(),
        })).to.have.property("filters").and.to.have.members([filter]);
    });

    it("accepts global filters", function() {
        const filter: InlineEventFilter<"message"> = Filters.Events.Inline(sinon.spy());

        botMockGlobals.addGlobalEventFilter(filter);

        expect(new Event({
            bot: botMockGlobals,
            id: "test",
            type: "message",
            handler: sinon.fake(),
        })).to.have.property("filters").and.to.have.members([filter]);
    });

    it("calls filters and returns true if no filter was passed", async function() {
        const event: Event = new Event({
            id: "test",
            type: "message",
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        const response = await event.callFilters(payload, context);

        expect(response).to.be.true;
    });

    it("calls filters, in order, with correct parameters", async function() {
        const callback1 = sinon.spy();
        const callback2 = sinon.spy();

        const filter1: InlineEventFilter<"message"> = Filters.Events.Inline(callback1);
        const filter2: InlineEventFilter<"message"> = Filters.Events.Inline(callback2);

        const event: Event = new Event({
            id: "test",
            type: "message",
            filters: [filter1, filter2],
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        await event.callFilters(payload, context);

        sinon.assert.calledWith(callback1, payload, context);
        sinon.assert.calledWith(callback2, payload, context);

        expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
    });
    
    it("stops flow to interceptors if one returns false", async function() {
        const filterH = sinon.stub().returns(false);
        const interceptorH = sinon.stub();
        const eventH = sinon.spy();

        const filter: InlineEventFilter<"message"> = Filters.Events.Inline(filterH);
        const interceptor: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(interceptorH);

        const event: Event = new Event({
            id: "test",
            type: "message",
            filters: [filter],
            interceptors: [interceptor],
            handler: eventH,
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        await event.call(messageMock);

        sinon.assert.calledWith(filterH, payload, context);
        sinon.assert.notCalled(interceptorH);
    });

    it("stops flow to command handler if one returns false", async function() {
        const filterH = sinon.stub().returns(false);
        const eventH = sinon.spy();

        const filter: InlineEventFilter<"message"> = Filters.Events.Inline(filterH);

        const event: Event = new Event({
            id: "test",
            type: "message",
            filters: [filter],
            handler: eventH,
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        await event.call(messageMock);

        sinon.assert.calledWith(filterH, payload, context);
        sinon.assert.notCalled(eventH);
    });
})