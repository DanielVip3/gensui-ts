import { InlineEventFilter } from '../../filters/Filters';
import { Event, EventContext } from '../../classes/events/Event';
import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

import shouldBeAFilter from './FilterTestGenerics';

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));
const eventMock: Event = new Event({
    id: "test",
    type: "message",
    handler: sinon.fake(),
});

describe("Events built-in filters", function() {
    describe("InlineFilter", function() {
        shouldBeAFilter(InlineEventFilter, [sinon.stub().returns(true)], [messageMock]);

        it("accepts and calls a callback with correct parameters", async function() {
            const callback = sinon.stub().returns(true);
            const filter: InlineEventFilter<"message"> = new InlineEventFilter(callback);

            const payload: [Message] = [messageMock];
            const context = { event: eventMock, } as EventContext;
            await filter.filter(payload, context);

            sinon.assert.calledWith(callback, payload, context);
        });

        it("handleError does not return nothing, thus not throwing errors if false", async function() {
            const callback = sinon.stub().returns(false);
            const filter: InlineEventFilter<"message"> = new InlineEventFilter(callback);

            expect(await filter.handleError(true)).to.not.be.ok;
        });
    });
});