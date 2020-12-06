import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { CommandArgsParser, customTypes } from '../../classes/commands/args/CommandArgsParser';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Client, DMChannel, Guild, GuildChannel, GuildEmoji, GuildMember, Message, Role, SnowflakeUtil, TextChannel, User, VoiceChannel } from 'discord.js';

import * as sinon from 'sinon';

const testRawArguments = ["test", "test1"];

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

const commandCallOptionsMock = (customRawArguments?) => { return { prefix: "!", name: "test", mentionHandled: false, rawArguments: customRawArguments || testRawArguments } as CommandCallOptions };
const commandContextMock = (command, customRawArguments?) => { return { command, message: messageMock, call: commandCallOptionsMock(customRawArguments || testRawArguments) } as CommandContext };

describe("CommandArgsParser", function() {
    it("instantiates", function() {
        expect(new CommandArgsParser({id: "test"})).to.be.an.instanceof(CommandArgsParser);
    });

    it("also accepts multiple arguments", function() {
        expect(new CommandArgsParser({id: "test"}, {id: "test1"})).to.have.property("test").which.is.an("array").which.has.lengthOf(2);
    });
    
    it("adds custom type correctly", function() {
        const cast = function(value) {
            return value + value;
        };
        CommandArgsParser.addType("test", cast);
        
        expect(customTypes).to.have.property("test", cast);
        delete customTypes['test'];
    });

    it("removes custom type correctly", function() {
        const cast = function(value) {
            return value + value;
        };
        CommandArgsParser.addType("test", cast);
        CommandArgsParser.removeType("test");
        
        expect(customTypes).to.not.have.property("test");
    });

    it("casts custom type correctly", async function() {
        const cast = function(value) {
            return value + value;
        };
        CommandArgsParser.addType("test", cast);

        const parser = new CommandArgsParser();
        
        expect(await parser.castType("value", "test", messageMock)).to.be.equal("valuevalue");

        CommandArgsParser.removeType("test");
    });

    it("casts to null if no value is specified", async function() {
        const parser = new CommandArgsParser();
        
        //@ts-ignore
        expect(await parser.castType(undefined, "test", messageMock)).to.be.null;
    });

    it("casts to null if no type is specified", async function() {
        const parser = new CommandArgsParser();
        
        //@ts-ignore
        expect(await parser.castType("value", undefined, messageMock)).to.be.null;
    });

    it("casts to null if both value and type are specified", async function() {
        const parser = new CommandArgsParser();
        
        //@ts-ignore
        expect(await parser.castType(undefined, undefined, messageMock)).to.be.null;
    });

    it("casts to null if the specified type is not found", async function() {
        const parser = new CommandArgsParser();
        
        expect(await parser.castType("value", "unexistingtype", messageMock)).to.be.null;
    });
});

describe("CommandArgs types casting", function() {
    const parser = new CommandArgsParser();

    it("casts valid value to string correctly", async function() {
        expect(await parser.castType("test", "string", messageMock)).to.be.a("string").which.is.equal("test");
    });

    it("casts valid value to number correctly", async function() {
        expect(await parser.castType("1", "number", messageMock)).to.be.a("number").which.is.equal(1);
    });

    it("casts valid value to int correctly", async function() {
        expect(await parser.castType("1.2", "int", messageMock)).to.be.a("number").which.is.equal(1);
    });

    it("casts valid value to float correctly", async function() {
        expect(await parser.castType("1.2", "float", messageMock)).to.be.a("number").which.is.equal(1.2);
    });

    it("casts valid value to URL correctly", async function() {
        expect(await parser.castType("https://test.com", "url", messageMock)).to.be.instanceof(URL);
    });

    describe("date casting", function() {
        it("casts valid value to Date correctly", async function() {
            expect(await parser.castType("01/01/1970", "date", messageMock)).to.be.instanceof(Date);
        });
    
        it("casts invalid value to null correctly", async function() {
            expect(await parser.castType("test", "date", messageMock)).to.be.null;
        });
    });

    describe("color casting", function() {
        it("casts valid hex color with # to number correctly", async function() {
            expect(await parser.castType("#ffffff", "color", messageMock)).to.be.a("number").which.is.equal(16777215); // 16777215 is white (#ffffff) in decimal
        });

        it("casts valid hex color without to number correctly", async function() {
            expect(await parser.castType("ffffff", "color", messageMock)).to.be.a("number").which.is.equal(16777215); // 16777215 is white (#ffffff) in decimal
        });

        it("casts invalid value to null correctly", async function() {
            expect(await parser.castType("test", "color", messageMock)).to.be.null;
        });
    });

    describe("boolean casting", function() {
        it("casts valid 'on' to true correctly", async function() {
            expect(await parser.castType("on", "boolean", messageMock)).to.be.true;
        });
    
        it("casts valid '1' to true correctly", async function() {
            expect(await parser.castType("1", "boolean", messageMock)).to.be.true;
        });

        it("casts valid 'yes' to true correctly", async function() {
            expect(await parser.castType("yes", "boolean", messageMock)).to.be.true;
        });

        it("casts valid 'true' to true correctly", async function() {
            expect(await parser.castType("true", "boolean", messageMock)).to.be.true;
        });

        it("casts valid 'off' to false correctly", async function() {
            expect(await parser.castType("off", "boolean", messageMock)).to.be.false;
        });
    
        it("casts valid '0' to false correctly", async function() {
            expect(await parser.castType("0", "boolean", messageMock)).to.be.false;
        });

        it("casts valid 'no' to false correctly", async function() {
            expect(await parser.castType("no", "boolean", messageMock)).to.be.false;
        });

        it("casts valid 'false' to false correctly", async function() {
            expect(await parser.castType("false", "boolean", messageMock)).to.be.false;
        });

        it("casts invalid value to null correctly", async function() {
            expect(await parser.castType("test", "boolean", messageMock)).to.be.null;
        });
    });

    /* DISCORD TYPES TESTING */

    /* I can't test deep fetching Discord without a cache because it needs a token and tests can't be made; so I won't test invalid value casting to null for all Discord structures */

    /*
    * Most fetch calls do throw an error when an object is defined as a partial from discord.js; so, to avoid them to be defined as partials, we must declare the following properties:
    * - User should define the username property
    * - GuildMember should define the joined_at property
    * - Message should define content property as a string and author property as a User
    */

    /* 
    * Also, from Discord API, all channels' types are expressed as numbers instead of a string ("text"), so we use:
    * - 0 for "text" channels testing
    * - 1 for "voice" channels testing
    * - 5 for "news" channels testing
    */

    /* Declaring all structures needed for all kind of tests */

    /* IDs for all structures and tests */
    const userIdMock = SnowflakeUtil.generate();
    const guildIdMock = SnowflakeUtil.generate();
    const guildChannelIdMock = SnowflakeUtil.generate();
    const dmChannelIdMock = SnowflakeUtil.generate();
    const textChannelIdMock = SnowflakeUtil.generate();
    const voiceChannelIdMock = SnowflakeUtil.generate();
    const messageChannelIdMock = SnowflakeUtil.generate();
    const messageIdMock = SnowflakeUtil.generate();
    const messageNoGuildIdMock = SnowflakeUtil.generate();
    const roleIdMock = SnowflakeUtil.generate();
    const emojiIdMock = SnowflakeUtil.generate();

    /* Structures */
    const client = new Client();
    const userMock = new User(client, { id: userIdMock, username: "test" }); // username to prevent it from being a partial
    const guildMock = new Guild(client, { id: guildIdMock });

    const memberMock = new GuildMember(client, { user: userMock, joined_at: Date.parse(new Date().toString()) }, guildMock); // joined_at to prevent it from being a partial

    const messageChannelMock = new TextChannel(guildMock, { id: messageChannelIdMock, type: 0 /* "text" */ });
    const messageMock = new Message(client, { id: messageIdMock, guild: guildMock, channel: messageChannelMock, content: "test", author: userMock }, messageChannelMock); // content and author to prevent it from being a partial

    const dmChannelMock = new DMChannel(client, { id: dmChannelIdMock, recipient: userMock });
    const messageNoGuildMock = new Message(client, { id: messageNoGuildIdMock, content: "test", author: userMock }, dmChannelMock); // content and author to prevent it from being a partial

    const guildChannelMock = new GuildChannel(guildMock, { id: guildChannelIdMock, type: 0 /* "text" */, user: userMock });
    const textChannelMock = new TextChannel(guildMock, { id: textChannelIdMock, type: 0 /* "text" */ });
    const voiceChannelMock = new VoiceChannel(guildMock, { id: voiceChannelIdMock, type: 2 /* "voice" */ });

    const roleMock = new Role(client, { id: roleIdMock }, guildMock);
    const emojiMock = new GuildEmoji(client, { id: emojiIdMock }, guildMock);

    /* Relationships between structures */
    client.users.cache.set(userIdMock, userMock);
    client.guilds.cache.set(guildIdMock, guildMock);

    messageChannelMock.messages.cache.set(messageIdMock, messageMock);

    guildMock.members.cache.set(userIdMock, memberMock);
    guildMock.channels.cache.set(guildChannelIdMock, guildChannelMock);
    guildMock.channels.cache.set(textChannelIdMock, textChannelMock);
    guildMock.channels.cache.set(voiceChannelIdMock, voiceChannelMock);
    guildMock.channels.cache.set(messageChannelIdMock, messageChannelMock); // added last to test if for loop iterations do reach
    guildMock.roles.cache.set(roleIdMock, roleMock);
    guildMock.emojis.cache.set(emojiIdMock, emojiMock);

   describe("Discord user casting", function() {
        it("casts valid user id to user correctly", async function() {
            expect(await parser.castType(userIdMock, "user", messageMock, client)).to.be.instanceof(User);
        });

        it("casts to null correctly if no client is passed", async function() {
            expect(await parser.castType(userIdMock, "user", messageMock)).to.be.null;
        });
    });

    describe("Discord guild member casting", function() {
        it("casts valid user id to member correctly", async function() {
            expect(await parser.castType(userIdMock, "member", messageMock, client)).to.be.instanceof(GuildMember);
        });

        it("casts to null correctly if no message is passed", async function() {
            //@ts-ignore
            expect(await parser.castType(userIdMock, "member", undefined)).to.be.null;
        });

        it("casts to null correctly if message passed has no guild", async function() {
            const dmChannel = new DMChannel(client, { recipient: userMock });
            const messageNoGuild = new Message(client, { id: SnowflakeUtil.generate(), author: userMock }, dmChannel);

            expect(await parser.castType(userIdMock, "member", messageNoGuild)).to.be.null;
        });
    });

    describe("Discord guild channel casting", function() {
        it("casts valid user id to channel correctly", async function() {
            expect(await parser.castType(guildChannelIdMock, "channel", messageMock, client)).to.be.instanceof(GuildChannel);
        });

        it("casts to null correctly if no message is passed", async function() {
            //@ts-ignore
            expect(await parser.castType(guildChannelIdMock, "channel", undefined)).to.be.null;
        });

        it("casts to null correctly if message passed has no guild", async function() {
            expect(await parser.castType(guildChannelIdMock, "channel", messageNoGuildMock)).to.be.null;
        });
    });

    describe("Discord text channel casting", function() {
        it("casts valid channel id to text channel correctly", async function() {
            expect(await parser.castType(textChannelIdMock, "textChannel", messageMock, client)).to.be.instanceof(TextChannel);
        });

        it("casts to null correctly if no message is passed", async function() {
            //@ts-ignore
            expect(await parser.castType(textChannelIdMock, "textChannel", undefined)).to.be.null;
        });

        it("casts to null correctly if message passed has no guild", async function() {
            expect(await parser.castType(textChannelIdMock, "textChannel", messageNoGuildMock)).to.be.null;
        });
    });

    describe("Discord voice channel casting", function() {
        it("casts valid channel id to voice channel correctly", async function() {
            expect(await parser.castType(voiceChannelIdMock, "voiceChannel", messageMock, client)).to.be.instanceof(VoiceChannel);
        });

        it("casts to null correctly if no message is passed", async function() {
            //@ts-ignore
            expect(await parser.castType(voiceChannelIdMock, "voiceChannel", undefined)).to.be.null;
        });

        it("casts to null correctly if message passed has no guild", async function() {
            expect(await parser.castType(voiceChannelIdMock, "voiceChannel", messageNoGuildMock)).to.be.null;
        });
    });

    describe("Discord role casting", function() {
        it("casts valid role id to role correctly", async function() {
            expect(await parser.castType(roleIdMock, "role", messageMock, client)).to.be.instanceof(Role);
        });

        it("casts to null correctly if no message is passed", async function() {
            //@ts-ignore
            expect(await parser.castType(roleIdMock, "role", undefined)).to.be.null;
        });

        it("casts to null correctly if message passed has no guild", async function() {
            expect(await parser.castType(roleIdMock, "role", messageNoGuildMock)).to.be.null;
        });
    });

    describe("Discord emoji casting", function() {
        it("casts valid emoji id to emoji correctly", async function() {
            expect(await parser.castType(emojiIdMock, "emoji", messageMock, client)).to.be.instanceof(GuildEmoji);
        });

        it("casts to null correctly if no message is passed", async function() {
            //@ts-ignore
            expect(await parser.castType(emojiIdMock, "emoji", undefined)).to.be.null;
        });

        it("casts to null correctly if message passed has no guild", async function() {
            expect(await parser.castType(emojiIdMock, "emoji", messageNoGuildMock)).to.be.null;
        });
    });

    describe("Discord guild casting", function() {
        it("casts valid emoji id to emoji correctly", async function() {
            expect(await parser.castType(guildIdMock, "guild", messageMock, client)).to.be.instanceof(Guild);
        });

        it("casts to null correctly if no client is passed", async function() {
            //@ts-ignore
            expect(await parser.castType(guildIdMock, "guild", undefined)).to.be.null;
        });
    });

    describe("Discord same channel message casting", function() {
        it("casts valid message id to message correctly", async function() {
            expect(await parser.castType(messageIdMock, "message", messageMock, client)).to.be.instanceof(Message);
        });

        it("casts valid message id to message correctly using the other type name, 'channelMessage'", async function() {
            expect(await parser.castType(messageIdMock, "channelMessage", messageMock, client)).to.be.instanceof(Message);
        });

        it("casts to null correctly if no message is passed", async function() {
            //@ts-ignore
            expect(await parser.castType(messageIdMock, "message", undefined)).to.be.null;
        });
    });
    
    describe("Discord same guild message casting", function() {
        it("casts valid message id to message correctly", async function() {
            expect(await parser.castType(messageIdMock, "guildMessage", messageMock, client)).to.be.instanceof(Message);
        });

        it("casts to null correctly if no message is passed", async function() {
            //@ts-ignore
            expect(await parser.castType(messageIdMock, "guildMessage", undefined)).to.be.null;
        });

        it("casts to null correctly if no textchannel is found from passed message's guild", async function() {
            const messageNoTextIdMock = SnowflakeUtil.generate();

            const guildNoText = new Guild(client, { id: SnowflakeUtil.generate() });
            const channelNoText = new TextChannel(guildNoText, { id: messageNoTextIdMock, guild: guildNoText, type: 5 /* news */ }); /* the channel is NOT text even though the class is TextChannel, because the type is 5 (news) */
            const messageNoText = new Message(client, { id: messageIdMock, author: userMock, guild: guildNoText, channel: channelNoText, content: "test" }, channelNoText);

            channelNoText.messages.cache.set(messageIdMock, messageNoText);
            guildNoText.channels.cache.set(messageNoTextIdMock, channelNoText);

            expect(await parser.castType(messageIdMock, "guildMessage", messageNoText, client)).to.be.null;
        });
    });
});

describe("Command's parser usage", function() {
    it("accepts a parser", function() {
        const parser: CommandArgsParser = new CommandArgsParser({
            id: "arg1",
        });

        expect(new Command({
            id: "test",
            names: "test",
            parser: parser,
            handler: sinon.fake(),
        })).to.have.property("parser").and.to.be.equal(parser);
    });

    it("calls parser and returns raw arguments if no parser was passed", async function() {
        const command: Command = new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        });

        const response = await command.callParser(commandContextMock(command));

        /* raw arguments object is like an array, where "0" property is the first passed, "1" is the second and so on; in this case we have "0": "test" */

        expect(response).to.have.property("0", "test");
    });

    it("calls parser and returns arguments parsed correctly", async function() {
        const parser: CommandArgsParser = new CommandArgsParser({
            id: "arg1",
        });

        const command: Command = new Command({
            id: "test",
            names: "test",
            parser: parser,
            handler: sinon.fake(),
        });

        const response = await command.callParser(commandContextMock(command));

        expect(response).to.have.property("arg1", "test");
    });

    it("calls parser and returns multiple arguments parsed correctly", async function() {
        const parser: CommandArgsParser = new CommandArgsParser({
            id: "arg1",
        }, {
            id: "arg2",
        });

        const command: Command = new Command({
            id: "test",
            names: "test",
            parser: parser,
            handler: sinon.fake(),
        });

        const response = await command.callParser(commandContextMock(command));

        expect(response).to.include.all.keys("arg1", "arg2");
    });
});