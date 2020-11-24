import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { Filters, InlineCommandFilter } from '../../filters/Filters';
import { Interceptors, InlineCommandInterceptor } from '../../interceptors/Interceptors';
import { Consumers, InlineCommandConsumer } from '../../consumers/Consumers';
import { CommandExceptionHandler } from '../../classes/exception-handler/CommandExceptionHandler';
import { CommandInterceptorResponse } from '../../classes/commands/CommandInterceptor';
import { CommandConsumerResponse } from '../../classes/commands/CommandConsumer';

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

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));

const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: [], arguments: [] } as CommandCallOptions;
const commandContextMock = (command) => { return { command, message: messageMock, call: commandCallOptionsMock } as CommandContext };

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

        sinon.assert.calledWith(callback, commandContextMock(command)); // data was not set because like next test, data is not setted if no hook edits it
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

                botMockGlobals.addGlobalCommandFilter(filter);

                expect(new Command({
                    bot: botMockGlobals,
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                })).to.have.property("filters").and.to.have.members([filter]);
            });

            it("calls filters and returns true if no filter was passed", async function() {
                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                });

                const response = await command.callFilters(commandContextMock(command));

                expect(response).to.be.true;
            });

            it("calls filters, in order, with correct parameters", async function() {
                const callback1 = sinon.stub().returns(true);
                const callback2 = sinon.stub().returns(true);

                const filter1: InlineCommandFilter = Filters.Commands.Inline(callback1);
                const filter2: InlineCommandFilter = Filters.Commands.Inline(callback2);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    filters: [filter1, filter2],
                    handler: sinon.fake(),
                });

                await command.callFilters(commandContextMock(command));

                sinon.assert.calledWith(callback1, commandContextMock(command));
                sinon.assert.calledWith(callback2, commandContextMock(command));

                expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
            });

            it("stops flow to interceptors if one returns false", async function() {
                const filterH = sinon.stub().returns(false);
                const interceptorH = sinon.stub();
                const commandH = sinon.spy();

                const filter: InlineCommandFilter = Filters.Commands.Inline(filterH);
                const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(interceptorH);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    filters: [filter],
                    interceptors: [interceptor],
                    handler: commandH,
                });

                await command.call(messageMock, commandCallOptionsMock);

                sinon.assert.calledWith(filterH, commandContextMock(command));
                sinon.assert.notCalled(interceptorH);
            });

            it("stops flow to command handler if one returns false", async function() {
                const filterH = sinon.stub().returns(false);
                const commandH = sinon.spy();

                const filter: InlineCommandFilter = Filters.Commands.Inline(filterH);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    filters: [filter],
                    handler: commandH,
                });

                await command.call(messageMock, commandCallOptionsMock);

                sinon.assert.calledWith(filterH, commandContextMock(command));
                sinon.assert.notCalled(commandH);
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

                botMockGlobals.addGlobalCommandInterceptor(interceptor);

                expect(new Command({
                    bot: botMockGlobals,
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                })).to.have.property("interceptors").and.to.have.members([interceptor]);
            });

            it("calls interceptors and flow goes forward if no interceptor was passed", async function() {
                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                });

                const response = await command.callInterceptors(commandContextMock(command));

                expect(response).to.be.ok;
                expect(response.next).to.be.true;
                expect(response.data).to.be.empty;
            });

            it("calls interceptors, in order, with correct parameters", async function() {
                const callback1 = sinon.stub().returns({ next: true });
                const callback2 = sinon.stub().returns({ next: true });

                const interceptor1: InlineCommandInterceptor = Interceptors.Commands.Inline(callback1);
                const interceptor2: InlineCommandInterceptor = Interceptors.Commands.Inline(callback2);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    interceptors: [interceptor1, interceptor2],
                    handler: sinon.fake(),
                });

                await command.callInterceptors(commandContextMock(command));

                sinon.assert.calledWith(callback1, commandContextMock(command));
                sinon.assert.calledWith(callback2, commandContextMock(command));

                expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
            });

            it("stops flow to command handler if one returns next as false", async function() {
                const interceptorH = sinon.stub().returns({ next: false });
                const commandH = sinon.spy();

                const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(interceptorH);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    interceptors: [interceptor],
                    handler: commandH,
                });

                await command.callInterceptors(commandContextMock(command));

                sinon.assert.calledWith(interceptorH, commandContextMock(command));
                sinon.assert.notCalled(commandH);
            });

            it("stops interceptors' flow if one returns next as false", async function() {
                const callback1 = sinon.stub().returns({ next: false });
                const callback2 = sinon.stub().returns({ next: true });

                const interceptor1: InlineCommandInterceptor = Interceptors.Commands.Inline(callback1);
                const interceptor2: InlineCommandInterceptor = Interceptors.Commands.Inline(callback2);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    interceptors: [interceptor1, interceptor2],
                    handler: sinon.fake(),
                });

                await command.callInterceptors(commandContextMock(command));

                sinon.assert.calledWith(callback1, commandContextMock(command));
                sinon.assert.notCalled(callback2);
            });

            it("merges interceptors' returned data", async function() {
                const callback1 = sinon.stub().returns({ next: true, data: { foo: 1, bar: 1 } });
                const callback2 = sinon.stub().returns({ next: true, data: { foo: 2 } });

                const interceptor1: InlineCommandInterceptor = Interceptors.Commands.Inline(callback1);
                const interceptor2: InlineCommandInterceptor = Interceptors.Commands.Inline(callback2);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    interceptors: [interceptor1, interceptor2],
                    handler: sinon.fake(),
                });

                const response: CommandInterceptorResponse = await command.callInterceptors(commandContextMock(command));

                expect(response.data).to.be.ok.and.to.include({ foo: 2, bar: 1 });
            });
        });

        describe("Consumers", function() {
            it("accepts consumers", function() {
                const consumer: InlineCommandConsumer = Consumers.Commands.Inline(sinon.spy());

                expect(new Command({
                    id: "test",
                    names: "test",
                    consumers: [consumer, consumer],
                    handler: sinon.fake(),
                })).to.have.property("consumers").and.to.have.members([consumer, consumer]);
        
                expect(new Command({
                    id: "test",
                    names: "test",
                    consumers: consumer,
                    handler: sinon.fake(),
                })).to.have.property("consumers").and.to.have.members([consumer]);
            });

            it("accepts global consumers", function() {
                const consumer: InlineCommandConsumer = Consumers.Commands.Inline(sinon.spy());

                botMockGlobals.addGlobalCommandConsumer(consumer);

                expect(new Command({
                    bot: botMockGlobals,
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                })).to.have.property("consumers").and.to.have.members([consumer]);
            });

            it("calls consumers and flow goes forward if no consumer was passed", async function() {
                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                });

                const response = await command.callConsumers(commandContextMock(command), "return data by command test");

                expect(response).to.be.ok;
                expect(response.next).to.be.true;
                expect(response.data).to.be.empty;
            });

            it("calls consumers, in order, with correct parameters", async function() {
                const callback1 = sinon.stub().returns({ next: true });
                const callback2 = sinon.stub().returns({ next: true });

                const consumer1: InlineCommandConsumer = Consumers.Commands.Inline(callback1);
                const consumer2: InlineCommandConsumer = Consumers.Commands.Inline(callback2);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    consumers: [consumer1, consumer2],
                    handler: sinon.fake(),
                });

                await command.callConsumers(commandContextMock(command), "return data by command test");

                sinon.assert.calledWith(callback1, commandContextMock(command), "return data by command test");
                sinon.assert.calledWith(callback2, commandContextMock(command), "return data by command test");

                expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
            });

            it("stops consumers' flow if one returns next as false", async function() {
                const callback1 = sinon.stub().returns({ next: false });
                const callback2 = sinon.stub().returns({ next: true });

                const consumer1: InlineCommandConsumer = Consumers.Commands.Inline(callback1);
                const consumer2: InlineCommandConsumer = Consumers.Commands.Inline(callback2);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    consumers: [consumer1, consumer2],
                    handler: sinon.fake(),
                });

                await command.callConsumers(commandContextMock(command), "return data by command test");

                sinon.assert.calledWith(callback1, commandContextMock(command), "return data by command test");
                sinon.assert.notCalled(callback2);
            });

            it("merges consumers' returned data", async function() {
                const callback1 = sinon.stub().returns({ next: true, data: { foo: 1, bar: 1 } });
                const callback2 = sinon.stub().returns({ next: true, data: { foo: 2 } });

                const consumer1: InlineCommandConsumer = Consumers.Commands.Inline(callback1);
                const consumer2: InlineCommandConsumer = Consumers.Commands.Inline(callback2);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    consumers: [consumer1, consumer2],
                    handler: sinon.fake(),
                });

                const response: CommandConsumerResponse = await command.callConsumers(commandContextMock(command), "return data by command test");

                expect(response.data).to.be.ok.and.to.include({ foo: 2, bar: 1 });
            });
        });

        describe("Exception Handlers", function() {
            it("accepts exception handlers in constructor", function() {
                const exceptionH: CommandExceptionHandler = {
                    id: "test",
                    exceptions: [],
                    handler: sinon.spy()
                };
                
                expect(new Command({
                    id: "test",
                    names: "test",
                    exceptions: [exceptionH, exceptionH],
                    handler: sinon.fake(),
                })).to.have.property("exceptions").and.to.have.members([exceptionH, exceptionH]);

                expect(new Command({
                    id: "test",
                    names: "test",
                    exceptions: exceptionH,
                    handler: sinon.fake(),
                })).to.have.property("exceptions").and.to.have.members([exceptionH]);
            });
            
            it("accepts exception handlers post-declaration", function() {
                const exceptionH: CommandExceptionHandler = {
                    id: "test",
                    exceptions: [],
                    handler: sinon.spy()
                };

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                });

                command.addExceptionHandler(exceptionH);
                command.addExceptionHandler(exceptionH);
                
                expect(command).to.have.property("exceptions").and.to.have.members([exceptionH, exceptionH]);
            });

            it("exception handlers function in post-declaration returns false if no exception handler is passed", async function() {
                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                });

                //@ts-ignore
                const response = command.addExceptionHandler();
                
                expect(response).to.be.false;
            });

            it("calls exception handlers and returns false if no exception handler was passed", async function() {
                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    handler: sinon.fake(),
                });

                const response = await command.callExceptionHandlers(commandContextMock(command), SyntaxError);

                expect(response).to.be.false;
            });

            it("calls exception handlers and returns false if no valid exception handler for the error was passed", async function() {
                const exceptionH: CommandExceptionHandler = {
                    id: "test",
                    exceptions: [TypeError],
                    handler: sinon.spy(),
                };

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    exceptions: [exceptionH],
                    handler: sinon.fake(),
                });

                const response = await command.callExceptionHandlers(commandContextMock(command), SyntaxError);

                expect(response).to.be.false;
            });

            it("calls correct exception handlers for specified errors", async function() {
                const callback = sinon.spy();

                const exceptionH: CommandExceptionHandler = {
                    id: "test",
                    exceptions: [SyntaxError],
                    handler: callback,
                };

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    exceptions: [exceptionH],
                    handler: sinon.fake(),
                });

                await command.callExceptionHandlers(commandContextMock(command), SyntaxError);
                await command.callExceptionHandlers(commandContextMock(command), TypeError);

                sinon.assert.calledOnce(callback); // Once because we want the exception handler to be called only on the first SyntaxError, not on the TypeError
            });

            it("calls multiple exception handlers in order", async function() {
                const callback1 = sinon.spy();
                const callback2 = sinon.spy();

                const exceptionH1: CommandExceptionHandler = {
                    id: "test",
                    exceptions: [SyntaxError],
                    handler: callback1,
                };

                const exceptionH2: CommandExceptionHandler = {
                    id: "test",
                    exceptions: [SyntaxError],
                    handler: callback2,
                };

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    exceptions: [exceptionH1, exceptionH2],
                    handler: sinon.fake(),
                });

                await command.callExceptionHandlers(commandContextMock(command), SyntaxError);

                expect(callback2.calledImmediatelyAfter(callback1)).to.be.true;
            });

            it("calls exception handlers when filters do have an error", async function() {
                const callbackExceptionHandler = sinon.spy();
                const callbackFilter = sinon.stub().throws(new SyntaxError("test"));

                const exceptionH: CommandExceptionHandler = {
                    id: "test",
                    exceptions: [SyntaxError],
                    handler: callbackExceptionHandler,
                };

                const filter: InlineCommandFilter = Filters.Commands.Inline(callbackFilter);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    exceptions: [exceptionH],
                    filters: [filter],
                    handler: sinon.fake(),
                });

                await command.callFilters(commandContextMock(command));

                sinon.assert.calledOnce(callbackExceptionHandler);
            });

            it("calls exception handlers when interceptors do have an error", async function() {
                const callbackExceptionHandler = sinon.spy();
                const callbackInterceptor = sinon.stub().throws(new SyntaxError("test"));

                const exceptionH: CommandExceptionHandler = {
                    id: "test",
                    exceptions: [SyntaxError],
                    handler: callbackExceptionHandler,
                };

                const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(callbackInterceptor);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    exceptions: [exceptionH],
                    interceptors: [interceptor],
                    handler: sinon.fake(),
                });

                await command.callInterceptors(commandContextMock(command));

                sinon.assert.calledOnce(callbackExceptionHandler);
            });

            it("calls exception handlers when consumers do have an error", async function() {
                const callbackExceptionHandler = sinon.spy();
                const callbackConsumer = sinon.stub().throws(new SyntaxError("test"));

                const exceptionH: CommandExceptionHandler = {
                    id: "test",
                    exceptions: [SyntaxError],
                    handler: callbackExceptionHandler,
                };

                const consumer: InlineCommandConsumer = Consumers.Commands.Inline(callbackConsumer);

                const command: Command = new Command({
                    id: "test",
                    names: "test",
                    exceptions: [exceptionH],
                    consumers: [consumer],
                    handler: sinon.fake(),
                });

                await command.callConsumers(commandContextMock(command), "return data by command test");

                sinon.assert.calledOnce(callbackExceptionHandler);
            });
        });

        it("calls all hooks in order", async function() {
            const callbackFilter = sinon.stub().returns(true);
            const callbackInterceptor = sinon.stub().returns({ next: true });
            const callbackCommand = sinon.stub();
            const callbackConsumer = sinon.stub().throws(new SyntaxError("test"));
            const callbackExceptionHandler = sinon.stub();

            const filter: InlineCommandFilter = Filters.Commands.Inline(callbackFilter);
            const interceptor: InlineCommandInterceptor = Interceptors.Commands.Inline(callbackInterceptor);
            const consumer: InlineCommandConsumer = Consumers.Commands.Inline(callbackConsumer);
            const exceptionH: CommandExceptionHandler = {
                id: "test",
                exceptions: [SyntaxError],
                handler: callbackExceptionHandler,
            };

            const command: Command = new Command({
                id: "test",
                names: "test",
                filters: [filter],
                interceptors: [interceptor],
                consumers: [consumer],
                exceptions: [exceptionH],
                handler: callbackCommand,
            });

            await command.call(messageMock, commandCallOptionsMock);

            expect(callbackFilter.calledImmediatelyBefore(callbackInterceptor)).to.be.true;
            expect(callbackInterceptor.calledImmediatelyBefore(callbackCommand)).to.be.true;
            expect(callbackCommand.calledImmediatelyBefore(callbackConsumer)).to.be.true;
            expect(callbackConsumer.calledImmediatelyBefore(callbackExceptionHandler)).to.be.true;
            sinon.assert.calledOnce(callbackExceptionHandler);
        });
    });
});