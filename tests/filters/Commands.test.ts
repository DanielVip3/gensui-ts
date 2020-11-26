import { DMFilter, GuildsFilter, InlineCommandFilter, NSFWFilter, TextChannelsFilter } from '../../filters/Filters';
import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { Client, DMChannel, Guild, Message, SnowflakeUtil, TextChannel } from 'discord.js';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

import shouldBeAFilter from './FilterTestGenerics';

const guildIdMock = SnowflakeUtil.generate();
const textChannelIdMock = SnowflakeUtil.generate();

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: guildIdMock }), { id: textChannelIdMock, nsfw: true }));
const commandMock: Command = new Command({
    id: "test",
    names: "test",
    handler: sinon.fake(),
});
const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: [], arguments: [] } as CommandCallOptions;
const commandContextMock = { command: commandMock, message: messageMock, call: commandCallOptionsMock } as CommandContext;


describe("Commands built-in filters", function() {
    describe("DMFilter", function() {
        const dmMessageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new DMChannel(discordClientMock, { id: SnowflakeUtil.generate() }));
        const dmCommandContextMock =  { command: commandMock, message: dmMessageMock, call: commandCallOptionsMock } as CommandContext;

        shouldBeAFilter(DMFilter, [], [dmCommandContextMock]);
    });

    describe("GuildsFilter", function() {
        shouldBeAFilter(GuildsFilter, [[guildIdMock]], [commandContextMock]);
    });

    describe("InlineFilter", function() {
        shouldBeAFilter(InlineCommandFilter, [sinon.stub().returns(true)], [commandContextMock]);

        it("accepts and calls a callback with correct parameters", async function() {
            const callback = sinon.stub().returns(true);
            const filter: InlineCommandFilter = new InlineCommandFilter(callback);

            await filter.filter(commandContextMock);

            sinon.assert.calledWith(callback, commandContextMock);
        });

        it("handleError does not return nothing, thus not throwing errors if false", async function() {
            const callback = sinon.stub().returns(false);
            const filter: InlineCommandFilter = new InlineCommandFilter(callback);

            expect(await filter.handleError(true)).to.not.be.ok;
        });
    });

    describe("NSFWFilter", function() {
        shouldBeAFilter(NSFWFilter, [], [commandContextMock]);
    });

    describe("TextChannelsFilter", function() {
        shouldBeAFilter(TextChannelsFilter, [[textChannelIdMock]], [commandContextMock]);
    });
});