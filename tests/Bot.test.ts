import Bot from "../classes/Bot";
import { InlineCommandFilter } from "../filters/Filters";
import { InlineCommandInterceptor } from "../interceptors/Interceptors";

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

    describe("Decorators", function() {
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

            it("joins multiple decoratedInterceptorrs when used multiple times", function() {
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
        });
    });
});