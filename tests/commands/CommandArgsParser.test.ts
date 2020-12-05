import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { CommandArgsParser, customTypes } from '../../classes/commands/args/CommandArgsParser';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Client, DMChannel, Guild, GuildMember, Message, SnowflakeUtil, TextChannel, User } from 'discord.js';

import * as sinon from 'sinon';
import { getDefaultLibFilePath } from 'typescript';

const testRawArguments = ["test", "test1"];

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: testRawArguments } as CommandCallOptions;
const commandContextMock = (command) => { return { command, message: messageMock, call: commandCallOptionsMock } as CommandContext };

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

    /* I can't test deep fetching Discord without a cache because it needs a token and tests can't be made; so I won't test invalid value casting to null for all Discord structures */

    /*
    * Most fetch calls do throw an error when an object is defined as a partial from discord.js; so, to avoid them to be defined as partials, we must declare the following properties:
    * - User should define the username property
    * - GuildMember should define the joined_at property
    */

   describe("discord user casting", function() {
        const userIdMock = SnowflakeUtil.generate();
        const client = new Client();
        const userMock = new User(client, { id: userIdMock, partial: false, username: "test" });

        client.users.cache.set(userIdMock, userMock);

        it("casts valid user id to user correctly", async function() {
            expect(await parser.castType(userIdMock, "user", messageMock, client)).to.be.instanceof(User);
        });

        it("casts to null correctly if no client is passed", async function() {
            expect(await parser.castType(userIdMock, "user", messageMock)).to.be.null;
        });
    });
});

describe("Command's parser usage", function() {
    it("accepts a parser", function() {
        const parser: CommandArgsParser = new CommandArgsParser({
            id: "test",
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
});