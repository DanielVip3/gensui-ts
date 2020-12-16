import Bot from "../classes/Bot";
import { InlineCommandFilter, InlineEventFilter } from "../filters/Filters";
import { InlineCommandInterceptor, InlineEventInterceptor } from "../interceptors/Interceptors";
import { InlineCommandConsumer, InlineEventConsumer } from "../consumers/Consumers";
import { CommandArgsParser } from "../classes/commands/args/CommandArgsParser";
import { Command } from "../classes/commands/Command";
import { Event, EventOptions } from "../classes/events/Event";

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

describe("Bot", function() {
    it("instantiates", function() {
        expect(new Bot({
            name: "test",
            token: "test"
        })).to.be.instanceof(Bot);
    });

    it("throws error if bot options are not passed", function() {
        //@ts-ignore
        expect(() => new Bot()).to.throw("options");
    });

    it("throws error if a bot name is not passed", function() {
        //@ts-ignore
        expect(() => new Bot({
            token: "test"
        })).to.throw("name");
    });

    it("throws error if a bot token is not passed", function() {
        //@ts-ignore
        expect(() => new Bot({
            name: "test",
        })).to.throw("token");
    });

    it("throws error if passed bot prefix is not a string or an array of strings", function() {
        expect(() => new Bot({
            name: "test",
            token: "test",
            //@ts-ignore
            prefix: true
        })).to.throw("prefix");

        expect(() => new Bot({
            name: "test",
            token: "test",
            //@ts-ignore
            prefix: 1
        })).to.throw("prefix");
    });

    it("default bot prefix is '!'", function() {
        expect(new Bot({
            name: "test",
            token: "test",
        })).to.have.property("prefix", "!");
    });

    it("accepts bot prefix if it's a string", function() {
        expect(new Bot({
            name: "test",
            token: "test",
            prefix: "test"
        })).to.have.property("prefix", "test");
    });

    it("accepts bot prefix if it's an array of strings", function() {
        const prefixes = ["test", "blah"];
        expect(new Bot({
            name: "test",
            token: "test",
            prefix: prefixes
        })).to.have.property("prefix", prefixes);
    });

    it("accepts and calls a ready handler when client is ready", function() {
        const readyHandler = sinon.fake();
        
        const bot = new Bot({
            name: "test",
            token: "test",
        }, readyHandler);

        bot.client.emit("ready");

        sinon.assert.called(readyHandler);
    });

    describe("Constants", function() {
        it("accepts a constant object", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({ test: "test" });

            expect(botMock).to.have.property("constants").which.has.property("test", "test");
        });

        it("accepts multiple constant objects", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({ test: "test" }, { test2: "test2" });

            expect(botMock).to.have.property("constants").which.has.property("test2", "test2");
        });

        it("joins multiple constant objects with multiple function calls", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({ test: "test" });
            botMock.constant({ test2: "test2" }, { test3: "test3" });

            expect(botMock).to.have.property("constants").which.has.property("test3", "test3");
        });

        /* Due to the fact that constants are... constants, we test that constants can't be overwritten */
        it("joins multiple constant objects with multiple function calls but without overwriting constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({ test: "test" });
            botMock.constant({ test: "test2" }, { test2: "test2" });

            expect(botMock).to.have.property("constants").which.has.property("test", "test");
        });

        it("gets undefined if non-nested constant value from constants is not found", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({ test: "test" });

            expect(botMock.get("undefinedTest")).to.be.equal(undefined);
        });

        it("gets a single non-nested constant value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({ test: "test" });

            expect(botMock.get("test")).to.be.equal("test");
        });

        it("gets a single non-nested constant falsy value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: null
            });

            expect(botMock.get("test")).to.be.equal(null);
        });

        it("gets a single non-nested constant boolean value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: true
            });

            expect(botMock.get("test")).to.be.equal(true);
        });

        it("gets a single non-nested constant array value from constants", function() {
            const arr = ["test", "test2"];

            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test:  arr
            });

            expect(botMock.get("test")).to.be.equal(arr);
        });

        it("gets undefined if nested constant value from constants is not found", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: "test",
                }
            });

            expect(botMock.get("test", "undefinedTest")).to.be.equal(undefined);
        });

        it("gets a single nested constant value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: "test"
                }
            });

            expect(botMock.get("test", "testN")).to.be.equal("test");
        });

        it("gets a single nested constant falsy value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: null
                }
            });

            expect(botMock.get("test", "testN")).to.be.equal(null);
        });

        it("gets a single nested constant boolean value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: true
                }
            });

            expect(botMock.get("test", "testN")).to.be.equal(true);
        });

        it("gets a single nested constant array value from constants", function() {
            const arr = ["test", "test2"];

            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: arr
                }
            });

            expect(botMock.get("test", "testN")).to.be.equal(arr);
        });

        it("gets a single constant value if constant method is used as multiple but only has a single return value", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({ test: "test" });

            expect(botMock.get(["test"])).to.be.equal("test");
        });

        it("gets undefined if multiple non-nested constant value from constants are not found", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({ test: "test" });

            expect(botMock.get(["undefinedTest"], ["undefinedTest2"])).to.be.deep.equal([undefined, undefined]);
        });

        it("gets multiple non-nested constant value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: "test",
                test2: "test2"
            });

            expect(botMock.get(["test"], ["test2"])).to.be.deep.equal(["test", "test2"]);
        });

        it("gets multiple non-nested constant falsy value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: null,
                test2: null
            });

            expect(botMock.get(["test"], ["test2"])).to.be.deep.equal([null, null]);
        });

        it("gets multiple non-nested constant boolean value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: true,
                test2: false
            });

            expect(botMock.get(["test"], ["test2"])).to.be.deep.equal([true, false]);
        });

        it("gets multiple non-nested constant array value from constants", function() {
            const arr1 = ["test", "test2"];
            const arr2 = ["test3", "test4"];

            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: arr1,
                test2: arr2
            });

            expect(botMock.get(["test"], ["test2"])).to.be.deep.equal([arr1, arr2]);
        });

        it("gets undefined if multiple nested constant value from constants are not found", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: "test",
                }
            });

            expect(botMock.get(["test", "undefinedTest"], ["test2", "undefinedTest2"])).to.be.deep.equal([undefined, undefined]);
        });

        it("gets multiple nested constant value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: "test",
                },
                test2: {
                    testN: "test",
                }
            });

            expect(botMock.get(["test", "testN"], ["test2", "testN"])).to.be.deep.equal(["test", "test"]);
        });

        it("gets multiple nested constant falsy value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: null,
                },
                test2: {
                    testN: null,
                }
            });

            expect(botMock.get(["test", "testN"], ["test2", "testN"])).to.be.deep.equal([null, null]);
        });

        it("gets multiple nested constant boolean value from constants", function() {
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: true,
                },
                test2: {
                    testN: true,
                }
            });

            expect(botMock.get(["test", "testN"], ["test2", "testN"])).to.be.deep.equal([true, true]);
        });

        it("gets multiple nested constant array value from constants", function() {
            const arr1 = ["test", "test2"];
            const arr2 = ["test3", "test4"];

            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: arr1,
                },
                test2: {
                    testN: arr2,
                }
            });

            expect(botMock.get(["test", "testN"], ["test2", "testN"])).to.be.deep.equal([arr1, arr2]);
        });

        it("gets mixed multiple and single constants", function() {
            const arr1 = ["test", "test2"];
            const arr2 = ["test3", "test4"];

            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                test: {
                    testN: arr1,
                },
                test2: arr2,
            });

            //@ts-ignore
            expect(botMock.get(["test", "testN"], "test2")).to.be.equal(undefined);
        });

        it("gets mixed constants", function() {
            const arr = ["test", "test2"];
            const fakeFunction = sinon.fake();

            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({
                function: fakeFunction,
                test: {
                    testN: "entire object test",
                },
                test2: {
                    testN: {
                        testN1: arr,
                        "test space": null,
                    }
                }
            });

            botMock.constant({
                test3: {
                    testN: {
                        testN: true
                    },
                }
            });

            expect(botMock.get(
                ["function"],
                ["test"],
                ["test2", "testN", "testN1"],
                ["test2", "testN", "test space"],
                ["test2", "testN", "undefined"],
                ["test3", "testN", "testN"],
            )).to.be.deep.equal([
                fakeFunction,
                { testN: "entire object test" },
                arr,
                null,
                undefined,
                true
            ]);
        });
    });
});

describe("Bot Decorators", function() {
    describe("Constant Decorator", function() {
        it("injects a constant to a property", function() {
            const objectMock = {};
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.constant({ test: "test", });

            botMock.Constant("test")(objectMock, "injectableProperty");

            expect(objectMock).to.have.property("injectableProperty", "test");
        });
    });

    describe("Scope Decorator", function() {
        it("injects id to property and sets IDAccessPropertyName", function() {
            const objectMock = {};
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Scope("test")(objectMock, "injectableProperty");

            expect(objectMock).to.have.property("injectableProperty", "test");
            expect(objectMock).to.have.property("IDAccessPropertyName", "injectableProperty");
        });
    });

    describe("Metadata Decorator", function() {
        it("sets decoratedMetadata value", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const metadata = {
                test: "test",
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Metadata(metadata)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedMetadata", metadata);
        });

        it("joins multiple decoratedMetadata when used multiple times", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const metadata = {
                test: "test",
            };

            const metadata2 = {
                test2: "test",
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Metadata(metadata)(objectMock, "injectableProperty", descriptor);
            botMock.Metadata(metadata2)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedMetadata").which.is.deep.equal({ ...metadata, ...metadata2 });
        });
    });

    describe("Description Decorator", function() {
        it("sets decoratedDescription value", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const description = "test";
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Description(description)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedDescription", description);
        });
    });

    describe("Filter Decorator", function() {
        it("sets decoratedFilters value", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const filter = new InlineCommandFilter(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Filter(filter)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedFilters").which.includes.members([filter]);
        });

        it("accepts and works with multiple filters", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const filter = new InlineCommandFilter(sinon.fake());
            const filter2 = new InlineCommandFilter(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Filter(filter, filter2)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedFilters").which.includes.members([filter, filter2]);
        });

        it("joins multiple decoratedFilters when used multiple times", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const filter = new InlineCommandFilter(sinon.fake());
            const filter2 = new InlineCommandFilter(sinon.fake());
            const filter3 = new InlineCommandFilter(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Filter(filter, filter2)(objectMock, "injectableProperty", descriptor);
            botMock.Filter(filter3)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedFilters").which.includes.members([filter, filter2, filter3]);
        });

        it("accepts events filters too", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const filter = new InlineEventFilter(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Filter(filter)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedFilters").which.includes.members([filter]);
        });
    });

    describe("Interceptor Decorator", function() {
        it("sets decoratedInterceptors value", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const interceptor = new InlineCommandInterceptor(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Interceptor(interceptor)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedInterceptors").which.includes.members([interceptor]);
        });

        it("accepts and works with multiple interceptors", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const interceptor = new InlineCommandInterceptor(sinon.fake());
            const interceptor2 = new InlineCommandInterceptor(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Interceptor(interceptor, interceptor2)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedInterceptors").which.includes.members([interceptor, interceptor2]);
        });

        it("joins multiple decoratedInterceptors when used multiple times", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const interceptor = new InlineCommandInterceptor(sinon.fake());
            const interceptor2 = new InlineCommandInterceptor(sinon.fake());
            const interceptor3 = new InlineCommandInterceptor(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Interceptor(interceptor, interceptor2)(objectMock, "injectableProperty", descriptor);
            botMock.Interceptor(interceptor3)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedInterceptors").which.includes.members([interceptor, interceptor2, interceptor3]);
        });

        it("accepts events interceptors too", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const interceptor = new InlineEventInterceptor(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Interceptor(interceptor)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedInterceptors").which.includes.members([interceptor]);
        });
    });

    describe("Consumer Decorator", function() {
        it("sets decoratedConsumers value", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const consumer = new InlineCommandConsumer(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Consumer(consumer)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedConsumers").which.includes.members([consumer]);
        });

        it("accepts and works with multiple consumers", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const consumer = new InlineCommandConsumer(sinon.fake());
            const consumer2 = new InlineCommandConsumer(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Consumer(consumer, consumer2)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedConsumers").which.includes.members([consumer, consumer2]);
        });

        it("joins multiple decoratedConsumers when used multiple times", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const consumer = new InlineCommandConsumer(sinon.fake());
            const consumer2 = new InlineCommandConsumer(sinon.fake());
            const consumer3 = new InlineCommandConsumer(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Consumer(consumer, consumer2)(objectMock, "injectableProperty", descriptor);
            botMock.Consumer(consumer3)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedConsumers").which.includes.members([consumer, consumer2, consumer3]);
        });

        it("accepts events consumers too", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const consumer = new InlineEventConsumer(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Consumer(consumer)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedConsumers").which.includes.members([consumer]);
        });
    });

    describe("Apply Decorator", function() {
        it("sets decoratedFilters value", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const filter = new InlineCommandFilter(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Apply(filter)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedFilters").which.includes.members([filter]);
        });

        it("sets decoratedInterceptors value", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const interceptor = new InlineCommandInterceptor(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Apply(interceptor)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedInterceptors").which.includes.members([interceptor]);
        });

        it("sets decoratedConsumers value", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const consumer = new InlineCommandConsumer(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Apply(consumer)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedConsumers").which.includes.members([consumer]);
        });

        it("accepts mixed hooks", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const filter = new InlineCommandFilter(sinon.fake());
            const interceptor = new InlineCommandInterceptor(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Apply(filter, interceptor)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedFilters").which.includes.members([filter]);
            expect(descriptor).to.have.property("decoratedInterceptors").which.includes.members([interceptor]);
        });

        it("joins multiple hooks when used multiple times", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const consumer = new InlineCommandConsumer(sinon.fake());
            const consumer2 = new InlineCommandConsumer(sinon.fake());
            const filter = new InlineCommandFilter(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Apply(consumer)(objectMock, "injectableProperty", descriptor);
            botMock.Apply(consumer2, filter)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedFilters").which.includes.members([filter]);
            expect(descriptor).to.have.property("decoratedConsumers").which.includes.members([consumer, consumer2]);
        });

        it("accepts events hooks too", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };

            const consumer = new InlineEventConsumer(sinon.fake());
            const filter = new InlineEventFilter(sinon.fake());
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Apply(consumer, filter)(objectMock, "injectableProperty", descriptor);

            expect(descriptor).to.have.property("decoratedFilters").which.includes.members([filter]);
            expect(descriptor).to.have.property("decoratedConsumers").which.includes.members([consumer]);
        });
    });

    describe("Command Decorator", function() {
        it("adds a command to bot", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Command()(objectMock, "injectableProperty", descriptor);

            expect(botMock).to.have.property("commands").which.has.lengthOf(1);
        });

        it("accepts and uses an id", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Command({
                id: "testId",
            })(objectMock, "testName", descriptor);

            expect(botMock.getCommand("testId")).to.be.instanceof(Command);
        });

        it("uses function name as command name by default", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Command(undefined, true)(objectMock, "testName", descriptor);

            expect(botMock.getCommand("testName")).to.be.ok.and.to.have.property("names").which.deep.includes.members(["testName"]);
        });

        it("lets you not use function name as command name", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Command({
                id: "testId",
                names: "testName"
            }, false)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("names").which.not.deep.includes.members(["injectableProperty"]);
        });

        it("accepts and uses a single name", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Command({
                id: "testId",
                names: "testCommand",
            })(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("names").which.deep.includes.members(["testCommand"]);
        });

        it("accepts and uses multiple names", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Command({
                id: "testId",
                names: ["testCommand", "testCommand2"],
            })(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("names").which.deep.includes.members(["testCommand", "testCommand2"]);
        });

        it("accepts and adds a single filter", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const filter = new InlineCommandFilter(sinon.fake());

            botMock.Command({
                id: "testId",
                names: "testCommand",
                filters: filter,
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("filters").which.deep.includes.members([filter]);
        });

        it("accepts and adds multiple filters", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const filter = new InlineCommandFilter(sinon.fake());
            const filter2 = new InlineCommandFilter(sinon.fake());

            botMock.Command({
                id: "testId",
                names: "testCommand",
                filters: [filter, filter2],
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("filters").which.deep.includes.members([filter, filter2]);
        });

        it("accepts and adds a single interceptor", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const interceptor = new InlineCommandInterceptor(sinon.fake());

            botMock.Command({
                id: "testId",
                names: "testCommand",
                interceptors: interceptor,
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("interceptors").which.deep.includes.members([interceptor]);
        });

        it("accepts and adds multiple interceptors", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const interceptor = new InlineCommandInterceptor(sinon.fake());
            const interceptor2 = new InlineCommandInterceptor(sinon.fake());

            botMock.Command({
                id: "testId",
                names: "testCommand",
                interceptors: [interceptor, interceptor2],
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("interceptors").which.deep.includes.members([interceptor, interceptor2]);
        });

        it("accepts and adds a single consumer", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const consumer = new InlineCommandConsumer(sinon.fake());

            botMock.Command({
                id: "testId",
                names: "testCommand",
                consumers: consumer
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("consumers").which.deep.includes.members([consumer]);
        });

        it("accepts and adds multiple consumers", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const consumer = new InlineCommandConsumer(sinon.fake());
            const consumer2 = new InlineCommandConsumer(sinon.fake());

            botMock.Command({
                id: "testId",
                names: "testCommand",
                consumers: [consumer, consumer2]
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("consumers").which.deep.includes.members([consumer, consumer2]);
        });

        it("accepts and adds a parser", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const parser = new CommandArgsParser();

            botMock.Command({
                id: "testId",
                names: "testCommand",
                parser: parser
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("parser", parser);
        });

        it("adds filters from Filter decorator", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const filter = new InlineCommandFilter(sinon.fake());

            botMock.Filter(filter)(objectMock, "injectableProperty", descriptor);

            botMock.Command({
                id: "testId",
                names: "testCommand",
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("filters").which.deep.includes.members([filter]);
        });

        it("joins filters from Filter decorator with passed options' filters", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const filter = new InlineCommandFilter(sinon.fake());
            const filter2 = new InlineCommandFilter(sinon.fake());

            botMock.Filter(filter)(objectMock, "injectableProperty", descriptor);

            botMock.Command({
                id: "testId",
                names: "testCommand",
                filters: filter2
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("filters").which.deep.includes.members([filter, filter2]);
        });

        it("adds interceptors from Interceptor decorator", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const interceptor = new InlineCommandInterceptor(sinon.fake());

            botMock.Interceptor(interceptor)(objectMock, "injectableProperty", descriptor);

            botMock.Command({
                id: "testId",
                names: "testCommand",
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("interceptors").which.deep.includes.members([interceptor]);
        });

        it("joins interceptors from Interceptor decorator with passed options' interceptors", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const interceptor = new InlineCommandInterceptor(sinon.fake());
            const interceptor2 = new InlineCommandInterceptor(sinon.fake());

            botMock.Interceptor(interceptor)(objectMock, "injectableProperty", descriptor);

            botMock.Command({
                id: "testId",
                names: "testCommand",
                interceptors: interceptor2
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("interceptors").which.deep.includes.members([interceptor, interceptor2]);
        });

        it("adds consumers from Consumer decorator", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const consumer = new InlineCommandConsumer(sinon.fake());

            botMock.Consumer(consumer)(objectMock, "injectableProperty", descriptor);

            botMock.Command({
                id: "testId",
                names: "testCommand",
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("consumers").which.deep.includes.members([consumer]);
        });

        it("joins consumers from Consumer decorator with passed options' consumers", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const consumer = new InlineCommandConsumer(sinon.fake());
            const consumer2 = new InlineCommandConsumer(sinon.fake());

            botMock.Consumer(consumer)(objectMock, "injectableProperty", descriptor);

            botMock.Command({
                id: "testId",
                names: "testCommand",
                consumers: consumer2
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getCommand("testId")).to.be.ok.and.to.have.property("consumers").which.deep.includes.members([consumer, consumer2]);
        });
    });
    
    describe("Event Decorator", function() {
        /* Due to the fact that a Discord.js Client basically is a Node.js EventEmitter, we have on, once, listeners... methods */

        it("requires an id and throws error if not set", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            expect(() => botMock.Event()(objectMock, "testName", descriptor)).to.throw("id");
        });

        it("accepts and uses a single type", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Event({
                id: "testId",
                type: "message"
            })(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("types").which.is.deep.equal(["message"]);
        });

        it("accepts and uses multiple types", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Event({
                id: "testId",
                type: ["message", "guildMemberAdd"]
            })(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("types").which.is.deep.equal(["message", "guildMemberAdd"]);
        });

        it("lets you use function name as event type", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Event({
                id: "testId",
            }, true)(objectMock, "message", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("types").to.be.deep.equal(["message"]);
        });

        it("adds an event to bot's client", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            botMock.Event({
                id: "testId",
                type: "message"
            })(objectMock, "injectableProperty", descriptor);

            expect(botMock.client.listeners("message")).to.have.lengthOf(1);
        });

        it("accepts and adds a single filter", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const filter = new InlineEventFilter(sinon.fake());

            botMock.Event({
                id: "testId",
                type: "message",
                filters: filter,
            })(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("filters").which.deep.includes.members([filter]);
        });

        it("accepts and adds multiple filters", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const filter = new InlineEventFilter(sinon.fake());
            const filter2 = new InlineEventFilter(sinon.fake());

            botMock.Event({
                id: "testId",
                type: "message",
                filters: [filter, filter2],
            })(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("filters").which.deep.includes.members([filter, filter2]);
        });

        it("accepts and adds a single interceptor", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const interceptor = new InlineEventInterceptor(sinon.fake());

            botMock.Event({
                id: "testId",
                type: "message",
                interceptors: interceptor,
            })(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("interceptors").which.deep.includes.members([interceptor]);
        });

        it("accepts and adds multiple interceptors", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const interceptor = new InlineEventInterceptor(sinon.fake());
            const interceptor2 = new InlineEventInterceptor(sinon.fake());

            botMock.Event({
                id: "testId",
                type: "message",
                interceptors: [interceptor, interceptor2],
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("interceptors").which.deep.includes.members([interceptor, interceptor2]);
        });

        it("accepts and adds a single consumer", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const consumer = new InlineEventConsumer(sinon.fake());

            botMock.Event({
                id: "testId",
                type: "message",
                consumers: consumer
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("consumers").which.deep.includes.members([consumer]);
        });

        it("accepts and adds multiple consumers", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const consumer = new InlineEventConsumer(sinon.fake());
            const consumer2 = new InlineEventConsumer(sinon.fake());

            botMock.Event({
                id: "testId",
                type: "message",
                consumers: [consumer, consumer2]
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("consumers").which.deep.includes.members([consumer, consumer2]);
        });

        it("adds filters from Filter decorator", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const filter = new InlineEventFilter(sinon.fake());

            botMock.Filter(filter)(objectMock, "injectableProperty", descriptor);

            botMock.Event({
                id: "testId",
                type: "message",
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("filters").which.deep.includes.members([filter]);
        });

        it("joins filters from Filter decorator with passed options' filters", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const filter = new InlineEventFilter(sinon.fake());
            const filter2 = new InlineEventFilter(sinon.fake());

            botMock.Filter(filter)(objectMock, "injectableProperty", descriptor);

            botMock.Event({
                id: "testId",
                type: "message",
                filters: filter2
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("filters").which.deep.includes.members([filter, filter2]);
        });

        it("adds interceptors from Interceptor decorator", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const interceptor = new InlineEventInterceptor(sinon.fake());

            botMock.Interceptor(interceptor)(objectMock, "injectableProperty", descriptor);

            botMock.Event({
                id: "testId",
                type: "message",
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("interceptors").which.deep.includes.members([interceptor]);
        });

        it("joins interceptors from Interceptor decorator with passed options' interceptors", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const interceptor = new InlineEventInterceptor(sinon.fake());
            const interceptor2 = new InlineEventInterceptor(sinon.fake());

            botMock.Interceptor(interceptor)(objectMock, "injectableProperty", descriptor);

            botMock.Event({
                id: "testId",
                type: "message",
                interceptors: interceptor2
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("interceptors").which.deep.includes.members([interceptor, interceptor2]);
        });

        it("adds consumers from Consumer decorator", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const consumer = new InlineEventConsumer(sinon.fake());

            botMock.Consumer(consumer)(objectMock, "injectableProperty", descriptor);

            botMock.Event({
                id: "testId",
                type: "message",
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("consumers").which.deep.includes.members([consumer]);
        });

        it("joins consumers from Consumer decorator with passed options' consumers", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const consumer = new InlineEventConsumer(sinon.fake());
            const consumer2 = new InlineEventConsumer(sinon.fake());

            botMock.Consumer(consumer)(objectMock, "injectableProperty", descriptor);

            botMock.Event({
                id: "testId",
                type: "message",
                consumers: consumer2
            }, true)(objectMock, "injectableProperty", descriptor);

            expect(botMock.getEvent("testId")).to.be.ok.and.to.have.property("consumers").which.deep.includes.members([consumer, consumer2]);
        });
    });

    describe("On Decorator", function() {
        it("simply calls Event decorator", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const spyEventDecorator = sinon.spy(botMock, "Event");

            const options = {
                id: "testId",
                type: "message",
            } as EventOptions;

            botMock.On(options, false)(objectMock, "injectableProperty", descriptor);

            sinon.assert.calledWith(spyEventDecorator, options, false);
        });
    });

    describe("Once Decorator", function() {
        it("simply calls Event decorator with 'once' property set as true", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const spyEventDecorator = sinon.spy(botMock, "Event");

            const options = {
                id: "testId",
                type: "message",
            } as EventOptions;

            botMock.Once(options, false)(objectMock, "injectableProperty", descriptor);

            sinon.assert.calledWith(spyEventDecorator, options, false);
            expect(options).to.have.property("once", true);
        });
    });

    describe("ExceptCommand Decorator", function() {
        it("requires an id and throws error if not set", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            //@ts-ignore
            expect(() => botMock.ExceptCommand()(objectMock, "testName", descriptor)).to.throw("id");
        });

        it("adds an exception handler to command", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const commandMock = new Command({
                id: "test",
                names: "test",
                handler: sinon.fake()
            });

            botMock.addCommand(commandMock);

            botMock.ExceptCommand({
                id: "test",
            })(objectMock, "injectableProperty", descriptor);

            expect(commandMock).to.have.property("exceptions").which.has.lengthOf(1);
        });

        it("accepts multiple ids and sets exception handler to multiple commands", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const commandMock = new Command({
                id: "test",
                names: "test",
                handler: sinon.fake()
            });

            const commandMock2 = new Command({
                id: "test2",
                names: "test2",
                handler: sinon.fake()
            });

            botMock.addCommand(commandMock);
            botMock.addCommand(commandMock2);

            botMock.ExceptCommand({
                id: ["test", "test2"],
            })(objectMock, "injectableProperty", descriptor);

            expect(commandMock).to.have.property("exceptions").which.has.lengthOf(1);
            expect(commandMock2).to.have.property("exceptions").which.has.lengthOf(1);
        });
    });

    describe("ExceptEvent Decorator", function() {
        it("requires an id and throws error if not set", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            //@ts-ignore
            expect(() => botMock.ExceptEvent()(objectMock, "testName", descriptor)).to.throw("id");
        });

        it("adds an exception handler to event", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const eventMock = new Event({
                id: "test",
                type: "message",
                handler: sinon.fake()
            });

            botMock.addEvent(eventMock);

            botMock.ExceptEvent({
                id: "test",
            })(objectMock, "injectableProperty", descriptor);

            expect(eventMock).to.have.property("exceptions").which.has.lengthOf(1);
        });

        it("accepts multiple ids and sets exception handler to multiple events", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const eventMock = new Event({
                id: "test",
                type: "message",
                handler: sinon.fake()
            });

            const eventMock2 = new Event({
                id: "test2",
                type: "message",
                handler: sinon.fake()
            });

            botMock.addEvent(eventMock);
            botMock.addEvent(eventMock2);

            botMock.ExceptEvent({
                id: ["test", "test2"],
            })(objectMock, "injectableProperty", descriptor);

            expect(eventMock).to.have.property("exceptions").which.has.lengthOf(1);
            expect(eventMock2).to.have.property("exceptions").which.has.lengthOf(1);
        });
    });

    describe("Except Decorator", function() {
        it("requires an id and throws error if not set", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            //@ts-ignore
            expect(() => botMock.Except()(objectMock, "testName", descriptor)).to.throw("id");
        });

        it("adds an exception handler to command", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const commandMock = new Command({
                id: "test",
                names: "test",
                handler: sinon.fake()
            });

            botMock.addCommand(commandMock);

            botMock.Except({
                id: "test",
            })(objectMock, "injectableProperty", descriptor);

            expect(commandMock).to.have.property("exceptions").which.has.lengthOf(1);
        });

        it("adds an exception handler to event", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const eventMock = new Event({
                id: "test",
                type: "message",
                handler: sinon.fake()
            });

            botMock.addEvent(eventMock);

            botMock.Except({
                id: "test",
            })(objectMock, "injectableProperty", descriptor);

            expect(eventMock).to.have.property("exceptions").which.has.lengthOf(1);
        });

        it("can also handle both commands and events if they have the same id", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const commandMock = new Command({
                id: "test",
                names: "test",
                handler: sinon.fake()
            });

            const eventMock = new Event({
                id: "test",
                type: "message",
                handler: sinon.fake()
            });

            botMock.addCommand(commandMock);
            botMock.addEvent(eventMock);

            botMock.Except({
                id: "test",
            })(objectMock, "injectableProperty", descriptor);

            expect(commandMock).to.have.property("exceptions").which.has.lengthOf(1);
            expect(eventMock).to.have.property("exceptions").which.has.lengthOf(1);
        });

        it("accepts multiple ids and sets exception handler to multiple commands and events", function() {
            const objectMock = {};
            const descriptor = {
                value: sinon.fake(),
                writable: false,
            };
            
            const botMock = new Bot({
                name: "test",
                token: "test",
            });

            const commandMock = new Command({
                id: "test",
                names: "test",
                handler: sinon.fake()
            });

            const eventMock = new Event({
                id: "test",
                type: "message",
                handler: sinon.fake()
            });

            const eventMock2 = new Event({
                id: "test2",
                type: "message",
                handler: sinon.fake()
            });

            botMock.addCommand(commandMock);
            botMock.addEvent(eventMock);
            botMock.addEvent(eventMock2);

            botMock.Except({
                id: ["test", "test2"],
            })(objectMock, "injectableProperty", descriptor);

            expect(commandMock).to.have.property("exceptions").which.has.lengthOf(1);
            expect(eventMock).to.have.property("exceptions").which.has.lengthOf(1);
            expect(eventMock2).to.have.property("exceptions").which.has.lengthOf(1);
        });
    });
});