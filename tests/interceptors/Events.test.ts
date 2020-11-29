import { InlineEventInterceptor } from '../../interceptors/Interceptors';
import { Event, EventContext } from '../../classes/events/Event';
import { EventInterceptorResponse } from '../../classes/events/EventInterceptor';
import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

import shouldBeAnInterceptor from './InterceptorTestGenerics';

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));
const eventMock: Event = new Event({
    id: "test",
    type: "message",
    handler: sinon.fake(),
});

const interceptorResponseMock = { next: true } as EventInterceptorResponse;

describe("Events built-in interceptors", function() {
    describe("InlineInterceptor", function() {
        shouldBeAnInterceptor(InlineEventInterceptor, [sinon.stub().returns(interceptorResponseMock)], [messageMock]);

        it("accepts and calls a callback with correct parameters", async function() {
            const callback = sinon.stub().returns(interceptorResponseMock);
            const interceptor: InlineEventInterceptor<"message"> = new InlineEventInterceptor(callback);

            const payload: [Message] = [messageMock];
            const context = { event: eventMock, } as EventContext;
            await interceptor.intercept(payload, context);

            sinon.assert.calledWith(callback, payload, context);
        });
    });
});