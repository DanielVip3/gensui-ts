import { Event, EventContext, EventPayload } from '../../classes/events/Event';
import { expect } from 'chai';
import { Filters, InlineEventFilter } from '../../filters/Filters';
import { Interceptors, InlineEventInterceptor } from '../../interceptors/Interceptors';
import { Consumers, InlineEventConsumer } from '../../consumers/Consumers';
import { EventExceptionHandler } from '../../classes/exception-handler/ExceptionHandler';

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