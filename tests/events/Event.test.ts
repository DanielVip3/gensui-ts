import { Event, EventContext, EventPayload } from '../../classes/events/Event';
import { expect } from 'chai';
import { Filters, InlineEventFilter } from '../../filters/Filters';
import { Interceptors, InlineEventInterceptor } from '../../interceptors/Interceptors';
import { Consumers, InlineEventConsumer } from '../../consumers/Consumers';
import { EventExceptionHandler } from '../../classes/exception-handler/ExceptionHandler';

import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as sinon from 'sinon';

const discordClientMock = new Client();

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

        await event.call(new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() })));

        sinon.assert.calledWith(callback, EventMessagePayloadMock, EventContextMock(event));
    });

    describe("Hooks", function() {
        describe("Filters", function() {
            it("accepts filters", function() {
                const filter: InlineEventFilter<"message"> = Filters.Events.Inline(([ message ]: EventPayload<"message">) => !message.author.bot);
                expect(new Event({
                    id: "test",
                    type: "message",
                    filters: [filter],
                    handler: function() { },
                })).to.have.property("filters").and.to.have.members([filter]);
        
                expect(new Event({
                    id: "test",
                    type: "message",
                    filters: filter,
                    handler: function() { },
                })).to.have.property("filters").and.to.have.members([filter]);
            });
        });

        describe("Interceptors", function() {
            it("accepts interceptors", function() {
                const interceptor: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(([ message ]: EventPayload<"message">) => { return { next: true }; });
                expect(new Event({
                    id: "test",
                    type: "message",
                    interceptors: [interceptor],
                    handler: function() { },
                })).to.have.property("interceptors").and.to.have.members([interceptor]);
        
                expect(new Event({
                    id: "test",
                    type: "message",
                    interceptors: interceptor,
                    handler: function() { },
                })).to.have.property("interceptors").and.to.have.members([interceptor]);
            });
        });
    
        describe("Consumers", function() {
            it("accepts consumers", function() {
                const consumer: InlineEventConsumer<"message"> = Consumers.Events.Inline(([ message ]: EventPayload<"message">) => { return { next: true }; });
                expect(new Event({
                    id: "test",
                    type: "message",
                    consumers: [consumer],
                    handler: function() { },
                })).to.have.property("consumers").and.to.have.members([consumer]);
        
                expect(new Event({
                    id: "test",
                    type: "message",
                    consumers: consumer,
                    handler: function() { },
                })).to.have.property("consumers").and.to.have.members([consumer]);
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
                    exceptions: [exceptionH],
                    handler: function() { },
                })).to.have.property("exceptions").and.to.have.members([exceptionH]);
            });
        });
    });
});