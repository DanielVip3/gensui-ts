import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { Filters, InlineCommandFilter } from '../../filters/Filters';
import { Interceptors, InlineCommandInterceptor } from '../../interceptors/Interceptors';
import { Consumers, InlineCommandConsumer } from '../../consumers/Consumers';

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

const botMockGlobals = new Bot({ // a bot mock to test global hooks
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

    it("handler gets called correctly", async function() {
        const callback = sinon.spy();

        const command: Command = new Command({
            id: "test",
            names: ["test"],
            handler: callback,
        });

        await command.call(messageMock, commandCallOptionsMock);

        sinon.assert.calledWith(callback, { command: command, message: messageMock, call: commandCallOptionsMock } as CommandContext); // data was not set because like next test, data is not setted if no hook edits it
    });

    it("context data does not exist if no hooks do set it", async function() {
        const callback = sinon.spy();

        const command: Command = new Command({
            id: "test",
            names: ["test"],
            handler: callback,
        });

        await command.call(messageMock, commandCallOptionsMock);

        sinon.assert.calledWith(callback, sinon.match((value) => value["data"] === undefined)); // data was not set because it's not setted if no hook edits it
    });

    describe("Hooks", function() {
        describe("Filters", function() {
            it("accepts filters", function() {
                const filter: InlineCommandFilter = Filters.Commands.Inline(sinon.spy());

                expect(new Command({
                    id: "test",
                    names: "test",
                    filters: [filter, filter],
                    handler: sinon.fake(),
                })).to.have.property("filters").and.to.have.members([filter, filter]);
        
                expect(new Command({
                    id: "test",
                    names: "test",
                    filters: filter,
                    handler: sinon.fake(),
                })).to.have.property("filters").and.to.have.members([filter]);
            });

            it("accepts global filters", function() {
                const filter: InlineCommandFilter = Filters.Commands.Inline(sinon.spy());

                botMockGlobals.addGlobalEventFilter(filter);

                expect(new Command({
                    bot: botMockGlobals,
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                })).to.have.property("filters").and.to.have.members([filter]);
            });
        });

        describe("Interceptors", function() {
            it("accepts interceptors", function() {
                const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(sinon.spy());

                expect(new Command({
                    id: "test",
                    names: "test",
                    interceptors: [interceptor, interceptor],
                    handler: sinon.fake(),
                })).to.have.property("interceptors").and.to.have.members([interceptor, interceptor]);
        
                expect(new Command({
                    id: "test",
                    names: "test",
                    interceptors: interceptor,
                    handler: sinon.fake(),
                })).to.have.property("interceptors").and.to.have.members([interceptor]);
            });

            it("accepts global filters", function() {
                const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(sinon.spy());

                botMockGlobals.addGlobalEventInterceptor(interceptor);

                expect(new Command({
                    bot: botMockGlobals,
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                })).to.have.property("interceptors").and.to.have.members([interceptor]);
            });
        });
    });
});