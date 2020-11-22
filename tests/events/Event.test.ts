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

const EventPayloadMock = sinon.match.array;
const EventContextMock = (event) => sinon.match.has("event", event);

const EventMessagePayloadMock = EventPayloadMock.and(sinon.match(a => a.length === 1));

describe("Event", function() {
    it("throws error if no id was specified", function() {
        expect(() => new Event({
            type: "message",
            handler: function() { },
        })).to.throw("id");
    });

    it("instantiates", function() {
        expect(new Event({
            id: "test",
            type: "message",
            handler: function() { },
        })).to.be.instanceOf(Event);
    });

    it("accepts multiple types", function() {
        expect(new Event({
            id: "test",
            type: ["message", "guildMemberAdd"],
            handler: function() { },
        })).to.have.property("types").and.to.be.an('array').and.to.have.lengthOf(2);
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
                const filter: InlineEventFilter<"message"> = Filters.Events.Inline(([ message ]: EventPayload<"message">) => !message.author.bot);
                expect(new Event({
                    id: "test",
                    type: "message",
                    filters: [filter, filter],
                    handler: function() { },
                })).to.have.property("filters").and.to.have.members([filter, filter]);
        
                expect(new Event({
                    id: "test",
                    type: "message",
                    filters: filter,
                    handler: function() { },
                })).to.have.property("filters").and.to.have.members([filter]);
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
                    handler: function() { },
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
                const interceptor: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(([ message ]: EventPayload<"message">) => { return { next: true }; });
                expect(new Event({
                    id: "test",
                    type: "message",
                    interceptors: [interceptor, interceptor],
                    handler: function() { },
                })).to.have.property("interceptors").and.to.have.members([interceptor, interceptor]);
        
                expect(new Event({
                    id: "test",
                    type: "message",
                    interceptors: interceptor,
                    handler: function() { },
                })).to.have.property("interceptors").and.to.have.members([interceptor]);
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
                    handler: function() { },
                });

                const payload = [messageMock] as EventPayload<"message">;
                const context = { event, } as EventContext;
                await event.callInterceptors(payload, context);

                sinon.assert.calledWith(callback1, payload, context);
                sinon.assert.calledWith(callback2, payload, context);

                expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
            });
        });
    
        describe("Consumers", function() {
            it("accepts consumers", function() {
                const consumer: InlineEventConsumer<"message"> = Consumers.Events.Inline(([ message ]: EventPayload<"message">) => { return { next: true }; });
                expect(new Event({
                    id: "test",
                    type: "message",
                    consumers: [consumer, consumer],
                    handler: function() { },
                })).to.have.property("consumers").and.to.have.members([consumer, consumer]);
        
                expect(new Event({
                    id: "test",
                    type: "message",
                    consumers: consumer,
                    handler: function() { },
                })).to.have.property("consumers").and.to.have.members([consumer]);
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
                    handler: function() { },
                });

                const payload = [messageMock] as EventPayload<"message">;
                const context = { event, } as EventContext;
                const returnData = "return data by command test";
                await event.callConsumers(payload, context, returnData);

                sinon.assert.calledWith(callback1, payload, context, returnData);
                sinon.assert.calledWith(callback2, payload, context, returnData);

                expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
            });
        });
        
        describe("Exception Handlers", function() {
            it("accepts exception handlers in constructor", function() {
                const exceptionH: EventExceptionHandler = {
                    id: "test",
                    exceptions: [],
                    handler: function() { }
                };
                
                expect(new Event({
                    id: "test",
                    type: "message",
                    exceptions: [exceptionH, exceptionH],
                    handler: function() { },
                })).to.have.property("exceptions").and.to.have.members([exceptionH, exceptionH]);
            });

            it("accepts exception handlers post-declaration", function() {
                const exceptionH: EventExceptionHandler = {
                    id: "test",
                    exceptions: [],
                    handler: function() { }
                };

                const event: Event = new Event({
                    id: "test",
                    type: "message",
                    handler: function() { },
                });

                event.addExceptionHandler(exceptionH);
                event.addExceptionHandler(exceptionH);
                
                expect(event).to.have.property("exceptions").and.to.have.members([exceptionH, exceptionH]);
            });

            it("calls exception handlers for correct errors", async function() {
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
                    handler: function() { },
                });

                await event.callExceptionHandlers({ event, } as EventContext, SyntaxError);
                await event.callExceptionHandlers({ event, } as EventContext, TypeError);

                sinon.assert.calledOnce(callback); // Once because we want the exception handler to be called only on the first SyntaxError, not on the TypeError
            });

            /*
            it("calls multiple exception handlers in order", async function() {
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
                    handler: function() { },
                });

                await event.callExceptionHandlers({ event, } as EventContext, SyntaxError);
                await event.callExceptionHandlers({ event, } as EventContext, TypeError);

                sinon.assert.calledOnce(callback); // Once because we want the exception handler to be called only on the first SyntaxError, not on the TypeError
            });
            */
        });
    });
});