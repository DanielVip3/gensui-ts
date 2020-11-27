import { DMFilter, GuildsFilter, InlineCommandFilter, NSFWFilter, TextChannelsFilter } from '../../filters/Filters';
import { DMError, GuildsError, NSFWError, TextChannelsError } from '../../errors';
import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { Client, DMChannel, Guild, Message, SnowflakeUtil, TextChannel, User } from 'discord.js';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

import shouldBeAFilter from './FilterTestGenerics';

const guildIdMock = SnowflakeUtil.generate();
const textChannelIdMock = SnowflakeUtil.generate();
const userIdMock = SnowflakeUtil.generate();
const usernameMock = "testname12";
const discriminatorMock = "2020";

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: guildIdMock }), { id: textChannelIdMock, nsfw: true }));
const userMock = new User(discordClientMock, { id: userIdMock, username: usernameMock, discriminator: discriminatorMock });
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

        shouldBeAFilter(DMFilter, [], [dmCommandContextMock], true, DMError);

        it("returns false if channel is not a DMChannel", async function() {
            const filter: DMFilter = new DMFilter();

            expect(await filter.filter(commandContextMock)).to.be.false;
        });
    });

    describe("GuildsFilter", function() {
        shouldBeAFilter(GuildsFilter, [[guildIdMock]], [commandContextMock], true, GuildsError);

        it("returns false if no guilds were passed", async function() {
            const filter: GuildsFilter = new GuildsFilter([]);

            expect(await filter.filter(commandContextMock)).to.be.false;
        });

        it("also accepts a single string instead of an array", async function() {
            const filter: GuildsFilter = new GuildsFilter(guildIdMock);

            expect(await filter.filter(commandContextMock)).to.be.true;
        });

        it("returns false if the guild is not accepted", async function() {
            const filter: GuildsFilter = new GuildsFilter([SnowflakeUtil.generate()]);

            expect(await filter.filter(commandContextMock)).to.be.false;
        });
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
        shouldBeAFilter(NSFWFilter, [], [commandContextMock], true, NSFWError);

        it("returns false if channel is not nsfw", async function() {
            const filter: NSFWFilter = new NSFWFilter();
            const nonNSFWChannelMessage = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: guildIdMock }), { id: textChannelIdMock }));
            const nonNSFWCommandContext = { command: commandMock, message: nonNSFWChannelMessage, call: commandCallOptionsMock } as CommandContext;

            expect(await filter.filter(nonNSFWCommandContext)).to.be.false;
        });
    });

    describe("TextChannelsFilter", function() {
        shouldBeAFilter(TextChannelsFilter, [[textChannelIdMock]], [commandContextMock], true, TextChannelsError);

        it("returns false if no channels were passed", async function() {
            const filter: TextChannelsFilter = new TextChannelsFilter([]);

            expect(await filter.filter(commandContextMock)).to.be.false;
        });

        it("also accepts a single string instead of an array", async function() {
            const filter: TextChannelsFilter = new TextChannelsFilter(textChannelIdMock);

            expect(await filter.filter(commandContextMock)).to.be.true;
        });

        it("also works with the channel name itself", async function() {
            const filter: TextChannelsFilter = new TextChannelsFilter(['testchannelname']);
            const textChannelMessage = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: guildIdMock }), { id: textChannelIdMock, name: "testchannelname" }));
            const textCommandContext = { command: commandMock, message: textChannelMessage, call: commandCallOptionsMock } as CommandContext;

            expect(await filter.filter(textCommandContext)).to.be.true;
        });

        it("also works with DMChannel, using recipient's id", async function() {
            const filter: TextChannelsFilter = new TextChannelsFilter([userIdMock]);
            const dmChannelMessage = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new DMChannel(discordClientMock, { id: textChannelIdMock, recipients: [userMock] }));
            const dmCommandContext = { command: commandMock, message: dmChannelMessage, call: commandCallOptionsMock } as CommandContext;

            expect(await filter.filter(dmCommandContext)).to.be.true;
        });

        it("also works with DMChannel, using recipient's username", async function() {
            const filter: TextChannelsFilter = new TextChannelsFilter(['testname12']);
            const dmChannelMessage = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new DMChannel(discordClientMock, { id: textChannelIdMock, recipients: [userMock] }));
            const dmCommandContext = { command: commandMock, message: dmChannelMessage, call: commandCallOptionsMock } as CommandContext;

            expect(await filter.filter(dmCommandContext)).to.be.true;
        });

        it("also works with DMChannel, using recipient's username and discriminator", async function() {
            const filter: TextChannelsFilter = new TextChannelsFilter(['testname12#2020']);
            const dmChannelMessage = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new DMChannel(discordClientMock, { id: textChannelIdMock, recipients: [userMock] }));
            const dmCommandContext = { command: commandMock, message: dmChannelMessage, call: commandCallOptionsMock } as CommandContext;

            expect(await filter.filter(dmCommandContext)).to.be.true;
        });

        it("returns false if the TextChannel is not accepted", async function() {
            const filter: TextChannelsFilter = new TextChannelsFilter(['notacceptedtest']);

            expect(await filter.filter(commandContextMock)).to.be.false;
        });

        it("returns false if the DMChannel is not accepted", async function() {
            const filter: TextChannelsFilter = new TextChannelsFilter(['notacceptedtest']);
            const dmChannelMessage = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new DMChannel(discordClientMock, { id: textChannelIdMock, recipients: [userMock] }));
            const dmCommandContext = { command: commandMock, message: dmChannelMessage, call: commandCallOptionsMock } as CommandContext;

            expect(await filter.filter(dmCommandContext)).to.be.false;
        });
    });
});