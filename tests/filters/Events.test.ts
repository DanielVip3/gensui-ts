import { InlineEventFilter } from '../../filters/Filters';
import { Client, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

import shouldBeAFilter from './FilterTestGenerics';

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

describe("Events built-in filters", function() {
    describe("InlineFilter", function() {
        shouldBeAFilter(InlineEventFilter, [sinon.stub().returns(true)], [messageMock]);
    });
});