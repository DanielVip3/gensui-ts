import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';

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

const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: [], arguments: [] } as CommandCallOptions;

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

describe("Command", function() {
    it("throws error if neither id and name were specified", function() {
        //@ts-ignore
        expect(() => new Command({
            handler: sinon.fake(),
        })).to.throw("id");
    });

    it("throws error if no name was specified", function() {
        //@ts-ignore
        expect(() => new Command({
            id: "test",
            handler: sinon.fake(),
        })).to.throw("name");
    });

    it("throws error if a command with the same id already exists", function() {
        const command = new Command({
            bot: botMockID,
            id: "test",
            names: "test",
            handler: sinon.fake(),
        });
        
        botMockID.addCommand(command);

        expect(() => new Command({
            bot: botMockID,
            id: "test",
            names: "test",
            handler: sinon.fake(),
        })).to.throw("id");
    });

    it("instantiates", function() {
        expect(new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        })).to.be.instanceOf(Command);
    });

    it("accepts single names", function() {
        expect(new Command({
            id: "test",
            names: "test",
            handler: sinon.fake(),
        })).to.have.property("names").and.to.be.an('array').and.to.have.lengthOf(1);
    });

    it("accepts multiple names", function() {
        expect(new Command({
            id: "test",
            names: ["test", "test2"],
            handler: sinon.fake(),
        })).to.have.property("names").and.to.be.an('array').and.to.have.lengthOf(2);
    });
});