import { Event, EventContext, EventPayload } from '../../classes/events/Event';
import { Interceptors, InlineEventInterceptor } from '../../interceptors/Interceptors';
import { EventInterceptorResponse } from '../../classes/events/EventInterceptor';

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

describe("EventInterceptor and Event's interceptor usage", function() {
    it("accepts interceptors", function() {
        const interceptor: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(sinon.spy());

        expect(new Event({
            id: "test",
            type: "message",
            interceptors: [interceptor, interceptor],
            handler: sinon.fake(),
        })).to.have.property("interceptors").and.to.have.members([interceptor, interceptor]);

        expect(new Event({
            id: "test",
            type: "message",
            interceptors: interceptor,
            handler: sinon.fake(),
        })).to.have.property("interceptors").and.to.have.members([interceptor]);
    });

    it("accepts global interceptors", function() {
        const interceptor: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(sinon.spy());

        botMockGlobals.addGlobalEventInterceptor(interceptor);

        expect(new Event({
            bot: botMockGlobals,
            id: "test",
            type: "message",
            handler: sinon.fake(),
        })).to.have.property("interceptors").and.to.have.members([interceptor]);
    });

    it("calls interceptors and flow goes forward if no interceptor was passed", async function() {
        const event: Event = new Event({
            id: "test",
            type: "message",
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        const response = await event.callInterceptors(payload, context);

        expect(response).to.be.ok;
        expect(response.next).to.be.true;
        expect(response.data).to.be.empty;
    });

    it("calls interceptors, in order, with correct parameters", async function() {
        const callback1 = sinon.stub().returns({ next: true });
        const callback2 = sinon.stub().returns({ next: true });

        const interceptor1: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(callback1);
        const interceptor2: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(callback2);

        const event: Event = new Event({
            id: "test",
            type: "message",
            interceptors: [interceptor1, interceptor2],
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        await event.callInterceptors(payload, context);

        sinon.assert.calledWith(callback1, payload, context);
        sinon.assert.calledWith(callback2, payload, context);

        expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
    });

    it("stops flow to event handler if one returns next as false", async function() {
        const interceptorH = sinon.stub().returns({ next: false });
        const eventH = sinon.spy();

        const interceptor: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(interceptorH);

        const event: Event = new Event({
            id: "test",
            type: "message",
            interceptors: [interceptor],
            handler: eventH,
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        await event.callInterceptors(payload, context);

        sinon.assert.calledWith(interceptorH, payload, context);
        sinon.assert.notCalled(eventH);
    });

    it("stops interceptors' flow if one returns next as false", async function() {
        const callback1 = sinon.stub().returns({ next: false });
        const callback2 = sinon.stub().returns({ next: true });

        const interceptor1: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(callback1);
        const interceptor2: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(callback2);

        const event: Event = new Event({
            id: "test",
            type: "message",
            interceptors: [interceptor1, interceptor2],
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        await event.callInterceptors(payload, context);

        sinon.assert.calledWith(callback1, payload, context);
        sinon.assert.notCalled(callback2);
    });

    it("merges interceptors' returned data", async function() {
        const callback1 = sinon.stub().returns({ next: true, data: { foo: 1, bar: 1 } });
        const callback2 = sinon.stub().returns({ next: true, data: { foo: 2 } });

        const interceptor1: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(callback1);
        const interceptor2: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(callback2);

        const event: Event = new Event({
            id: "test",
            type: "message",
            interceptors: [interceptor1, interceptor2],
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        const response: EventInterceptorResponse = await event.callInterceptors(payload, context);

        expect(response.data).to.be.ok.and.to.include({ foo: 2, bar: 1 });
    });

    it("stops event call's flow to command handler if interceptor returns next as false", async function() {
        const callbackInterceptor = sinon.stub().returns({ next: false });
        const callbackEvent = sinon.stub();

        const interceptor: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(callbackInterceptor);

        const event: Event = new Event({
            id: "test",
            type: "message",
            interceptors: [interceptor],
            handler: callbackEvent,
        });

        await event.call(messageMock);

        sinon.assert.called(callbackInterceptor);
        sinon.assert.notCalled(callbackEvent);
    });
});