import { Event, EventContext, EventPayload } from '../../classes/events/Event';
import { Filters, InlineEventFilter } from '../../filters/Filters';
import { Interceptors, InlineEventInterceptor } from '../../interceptors/Interceptors';
import { Consumers, InlineEventConsumer } from '../../consumers/Consumers';
import { EventExceptionHandler } from '../../classes/exception-handler/ExceptionHandler';
import { EventConsumerResponse } from '../../classes/events/EventConsumer';
import { EventInterceptorResponse } from '../../classes/events/EventInterceptor';

import Bot from '../../classes/Bot';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as sinon from 'sinon';

const botMockID = new Bot({ // a bot mock to test repeating ids error
    name: "mock",
    token: "test-token",
    prefix: "!"
});

const botMockGlobals = new Bot({ // a bot mock to test global hooks
    name: "mock",
    token: "test-token",
    prefix: "!"
});

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

const EventContextMock = (event) => sinon.match.has("event", event);

describe("Event", function() {
    it("throws error if no id was specified", function() {
        expect(() => new Event({
            type: "message",
            handler: sinon.fake(),
        })).to.throw("id");
    });

    it("throws error if an event with the same id already exists", function() {
        const event = new Event({
            bot: botMockID,
            id: "test-sameid",
            type: "message",
            handler: sinon.fake(),
        });
        botMockID.addEvent(event);

        expect(() => new Event({
            bot: botMockID,
            id: "test-sameid",
            type: "message",
            handler: sinon.fake(),
        })).to.throw("id");
    });

    it("throws error if no type was specified", function() {
        //@ts-ignore
        expect(() => new Event({
            id: "test",
            handler: sinon.fake(),
        })).to.throw("type");
    });

    it("instantiates", function() {
        expect(new Event({
            id: "test",
            type: "message",
            handler: sinon.fake(),
        })).to.be.instanceOf(Event);
    });

    it("accepts single types", function() {
        expect(new Event({
            id: "test",
            type: "message",
            handler: sinon.fake(),
        })).to.have.property("types").and.to.be.an('array').and.to.have.lengthOf(1);
    });

    it("accepts multiple types", function() {
        expect(new Event({
            id: "test",
            type: ["message", "guildMemberAdd"],
            handler: sinon.fake(),
        })).to.have.property("types").and.to.be.an('array').and.to.have.lengthOf(2);
    });

    it("accepts once property", function() {
        expect(new Event({
            id: "test",
            type: "message",
            once: true,
            handler: sinon.fake(),
        })).to.have.property("once").and.to.be.true;
    });

    it("handler gets called correctly", async function() {
        const callback = sinon.spy();

        const event: Event = new Event({
            id: "test",
            type: "message",
            handler: callback,
        });

        await event.call(messageMock);

        sinon.assert.calledWith(callback, [messageMock], EventContextMock(event));
    });

    describe("Hooks", function() {
        describe("Filters", function() {
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
        });

        describe("Interceptors", function() {
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
        });
    
        describe("Consumers", function() {
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
        });
        
        describe("Exception Handlers", function() {
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
    });
});