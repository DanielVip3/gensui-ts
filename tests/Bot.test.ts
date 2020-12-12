import Bot from "../classes/Bot";

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
    });
});