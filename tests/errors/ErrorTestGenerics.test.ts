import { expect } from 'chai';

export function shouldBeAGenericError(error) {
    it("instantiates", function() {
        expect(new error("Test error")).to.be.instanceOf(error);
    });

    it("throws fine", function() {
        expect(function() { throw new error("Test error"); }).to.throw(error);
    });

    it("has a working message", function() {
        expect(new error("Test error")).to.have.property("message").which.is.equal("Test error");
    });
};

export function shouldBeAnError(error, errorName: string, extendsBase: boolean = false, extendedBase: any = null) {
    it("instantiates", function() {
        expect(new error("Test error")).to.be.instanceOf(error);
    });

    it("has correct name", function() {
        expect(new error("Test error")).to.have.property("name").which.is.equal(errorName);
    });

    it("throws fine", function() {
        expect(function() { throw new error("Test error"); }).to.throw(error);
    });

    it("has a working message", function() {
        expect(new error("Test error")).to.have.property("message").which.is.equal("Test error");
    });

    if (extendsBase && extendedBase) {
        it("extends base error", function() {
            expect(new error("Test error")).to.be.instanceOf(extendedBase);
        });
    }
};