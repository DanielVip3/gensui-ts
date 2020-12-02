import { Event, EventContext, EventPayload } from '../../classes/events/Event';
import { Filters, InlineEventFilter } from '../../filters/Filters';
import { Interceptors, InlineEventInterceptor } from '../../interceptors/Interceptors';
import { Consumers, InlineEventConsumer } from '../../consumers/Consumers';
import { EventExceptionHandler } from '../../classes/exception-handler/ExceptionHandler';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as sinon from 'sinon';

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

describe("EventExceptionHandler and Event's ExceptionHandler usage", function() {
    it("accepts exception handlers in constructor", function() {
        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [],
            handler: sinon.spy()
        };
        
        expect(new Event({
            id: "test",
            type: "message",
            exceptions: [exceptionH, exceptionH],
            handler: sinon.fake(),
        })).to.have.property("exceptions").and.to.have.members([exceptionH, exceptionH]);

        expect(new Event({
            id: "test",
            type: "message",
            exceptions: exceptionH,
            handler: sinon.fake(),
        })).to.have.property("exceptions").and.to.have.members([exceptionH]);
    });

    it("accepts exception handlers post-declaration", function() {
        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [],
            handler: sinon.spy()
        };

        const event: Event = new Event({
            id: "test",
            type: "message",
            handler: sinon.fake(),
        });

        event.addExceptionHandler(exceptionH);
        event.addExceptionHandler(exceptionH);
        
        expect(event).to.have.property("exceptions").and.to.have.members([exceptionH, exceptionH]);
    });

    it("exception handlers function in post-declaration returns false if no exception handler is passed", async function() {
        const event: Event = new Event({
            id: "test",
            type: "message",
            handler: sinon.fake(),
        });

        //@ts-ignore
        const response = event.addExceptionHandler();
        
        expect(response).to.be.false;
    });

    it("calls exception handlers and returns false if no exception handler was passed", async function() {
        const event: Event = new Event({
            id: "test",
            type: "message",
            handler: sinon.fake(),
        });

        const response = await event.callExceptionHandlers({ event, } as EventContext, SyntaxError);

        expect(response).to.be.false;
    });

    it("calls exception handlers and returns false if no valid exception handler for the type was passed", async function() {
        const event: Event = new Event({
            id: "test",
            type: "message",
            //@ts-ignore
            exceptions: [1], // putting a number as an exception handler makes it invalid
            handler: sinon.fake(),
        });

        const response = await event.callExceptionHandlers({ event, } as EventContext, SyntaxError);

        expect(response).to.be.false;
    });

    it("calls exception handlers and returns false if no valid exception handler for the error was passed", async function() {
        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [TypeError],
            handler: sinon.spy(),
        };

        const event: Event = new Event({
            id: "test",
            type: "message",
            exceptions: [exceptionH],
            handler: sinon.fake(),
        });

        const response = await event.callExceptionHandlers({ event, } as EventContext, SyntaxError);

        expect(response).to.be.false;
    });

    it("calls exception handlers and returns false if no valid exception was passed", async function() {
        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [TypeError],
            handler: sinon.spy(),
        };

        const event: Event = new Event({
            id: "test",
            type: "message",
            exceptions: [exceptionH],
            handler: sinon.fake(),
        });

        const response = await event.callExceptionHandlers({ event, } as EventContext, 1);

        expect(response).to.be.false;
    });

    it("calls exception handlers with correct parameters", async function() {
        const callback = sinon.spy();

        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callback,
        };

        const event: Event = new Event({
            id: "test",
            type: "message",
            exceptions: [exceptionH],
            handler: sinon.fake(),
        });

        const context = { event, } as EventContext;
        const error = new SyntaxError("test");
        await event.callExceptionHandlers(context, error);

        sinon.assert.calledWith(callback, context, error);
    });

    it("calls correct exception handlers for specified errors", async function() {
        const callback = sinon.spy();

        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callback,
        };

        const event: Event = new Event({
            id: "test",
            type: "message",
            exceptions: [exceptionH],
            handler: sinon.fake(),
        });

        await event.callExceptionHandlers({ event, } as EventContext, SyntaxError);
        await event.callExceptionHandlers({ event, } as EventContext, TypeError);

        sinon.assert.calledOnce(callback); // Once because we want the exception handler to be called only on the first SyntaxError, not on the TypeError
    });

    it("calls multiple exception handlers in order", async function() {
        const callback1 = sinon.spy();
        const callback2 = sinon.spy();

        const exceptionH1: EventExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callback1,
        };

        const exceptionH2: EventExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callback2,
        };

        const event: Event = new Event({
            id: "test",
            type: "message",
            exceptions: [exceptionH1, exceptionH2],
            handler: sinon.fake(),
        });

        await event.callExceptionHandlers({ event, } as EventContext, SyntaxError);

        expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
    });

    it("calls exception handlers when event handlers do have an error", async function() {
        const callbackExceptionHandler = sinon.spy();
        const callbackEvent = sinon.stub().throws(new SyntaxError("test"));

        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const event: Event = new Event({
            id: "test",
            type: "message",
            exceptions: [exceptionH],
            handler: callbackEvent,
        });

        await event.call(messageMock);

        sinon.assert.calledOnce(callbackExceptionHandler);
    });
    
    it("calls exception handlers when filters do have an error", async function() {
        const callbackExceptionHandler = sinon.spy();
        const callbackFilter = sinon.stub().throws(new SyntaxError("test"));

        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const filter: InlineEventFilter<"message"> = Filters.Events.Inline(callbackFilter);

        const event: Event = new Event({
            id: "test",
            type: "message",
            exceptions: [exceptionH],
            filters: [filter],
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        await event.callFilters(payload, context);

        sinon.assert.calledOnce(callbackExceptionHandler);
    });

    it("calls exception handlers when interceptors do have an error", async function() {
        const callbackExceptionHandler = sinon.spy();
        const callbackInterceptor = sinon.stub().throws(new SyntaxError("test"));

        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const interceptor: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(callbackInterceptor);

        const event: Event = new Event({
            id: "test",
            type: "message",
            exceptions: [exceptionH],
            interceptors: [interceptor],
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        await event.callInterceptors(payload, context);

        sinon.assert.calledOnce(callbackExceptionHandler);
    });

    it("calls exception handlers when consumers do have an error", async function() {
        const callbackExceptionHandler = sinon.spy();
        const callbackConsumer = sinon.stub().throws(new SyntaxError("test"));

        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const consumer: InlineEventConsumer<"message"> = Consumers.Events.Inline(callbackConsumer);

        const event: Event = new Event({
            id: "test",
            type: "message",
            exceptions: [exceptionH],
            consumers: [consumer],
            handler: sinon.fake(),
        });

        const payload = [messageMock] as EventPayload<"message">;
        const context = { event, } as EventContext;
        const returnData = "return data by event test";
        await event.callConsumers(payload, context, returnData);

        sinon.assert.calledOnce(callbackExceptionHandler);
    });
});