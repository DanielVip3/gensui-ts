import exceptionShouldBeHandled from "../../classes/utils/exceptionShouldBeHandled";

import { expect } from "chai";

/* The first parameter to this method is the thrown exception, and the second is the accepted exception */

describe("exceptionShouldBeHandled function", function() {
    it("returns true if passed error and accepted error are an instance of the same object", function() {
        expect(exceptionShouldBeHandled(new SyntaxError(), new SyntaxError())).to.be.true;
    });

    it("returns true if passed error and accepted error are the constructor of the same class", function() {
        expect(exceptionShouldBeHandled(SyntaxError, SyntaxError)).to.be.true;
    });

    it("returns true if passed error is an instance and accepted error is the constructor, but both of the same class", function() {
        expect(exceptionShouldBeHandled(new SyntaxError(), SyntaxError)).to.be.true;
    });

    it("returns true if passed error is the constructor and accepted error is an instance, but both of the same class", function() {
        expect(exceptionShouldBeHandled(SyntaxError, new SyntaxError())).to.be.true;
    });

    it("returns false if passed error and accepted error are not an instance of the same object", function() {
        expect(exceptionShouldBeHandled(new SyntaxError(), new TypeError())).to.be.false;
    });

    it("returns false if passed error and accepted error are not the constructor of the same class", function() {
        expect(exceptionShouldBeHandled(SyntaxError, TypeError)).to.be.false;
    });

    it("returns false if passed error is an instance and accepted error is the constructor, but not of the same class", function() {
        expect(exceptionShouldBeHandled(new SyntaxError(), TypeError)).to.be.false;
    });

    it("returns false if passed error is the constructor and accepted error is an instance, but not both of the same class", function() {
        expect(exceptionShouldBeHandled(SyntaxError, new TypeError())).to.be.false;
    });

    describe("Error message", function() {
        it("returns true if accepted error is a string and passed error's message contains that string", function() {
            expect(exceptionShouldBeHandled(new SyntaxError("test value"), "test")).to.be.true;
        });

        it("returns false if accepted error is a string and passed error's message doesn't contain that string", function() {
            expect(exceptionShouldBeHandled(new SyntaxError("try value"), "test")).to.be.false;
        });
    });
});