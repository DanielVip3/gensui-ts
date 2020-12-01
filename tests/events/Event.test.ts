import { Event } from '../../classes/events/Event';
import { Filters, InlineEventFilter } from '../../filters/Filters';
import { Interceptors, InlineEventInterceptor } from '../../interceptors/Interceptors';
import { Consumers, InlineEventConsumer } from '../../consumers/Consumers';
import { EventExceptionHandler } from '../../classes/exception-handler/ExceptionHandler';

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

    it("throws error with method name inside if no id was specified and a methodName is specified", function() {
        expect(() => new Event({
            type: "message",
            handler: sinon.fake(),
            methodName: "testName"
        })).to.throw("testName");
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

    it("calls all hooks in order", async function() {
        const callbackFilter = sinon.stub().returns(true);
        const callbackInterceptor = sinon.stub().returns({ next: true });
        const callbackEvent = sinon.stub();
        const callbackConsumer = sinon.stub().throws(new SyntaxError("test"));
        const callbackExceptionHandler = sinon.stub();

        const filter: InlineEventFilter<"message"> = Filters.Events.Inline(callbackFilter);
        const interceptor: InlineEventInterceptor<"message"> = Interceptors.Events.Inline(callbackInterceptor);
        const consumer: InlineEventConsumer<"message"> = Consumers.Events.Inline(callbackConsumer);
        const exceptionH: EventExceptionHandler = {
            id: "test",
            exceptions: [SyntaxError],
            handler: callbackExceptionHandler,
        };

        const event: Event = new Event({
            id: "test",
            type: "message",
            filters: [filter],
            interceptors: [interceptor],
            consumers: [consumer],
            exceptions: [exceptionH],
            handler: callbackEvent,
        });

        await event.call(messageMock);

        expect(callbackFilter.calledImmediatelyBefore(callbackInterceptor)).to.be.true;
        expect(callbackInterceptor.calledImmediatelyBefore(callbackEvent)).to.be.true;
        expect(callbackEvent.calledImmediatelyBefore(callbackConsumer)).to.be.true;
        expect(callbackConsumer.calledImmediatelyBefore(callbackExceptionHandler)).to.be.true;
        sinon.assert.calledOnce(callbackExceptionHandler);
    });
});