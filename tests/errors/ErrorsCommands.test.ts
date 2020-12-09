import * as Errors from '../../errors';
import { expect } from 'chai';
import { shouldBeAnError } from './ErrorTestGenerics.test';

describe("Commands' errors", function() {
    it("exports all existing commands errors correctly", function() {
        expect(Errors).to.include.keys("CommandAlreadyExistingIDError",
                                    "CommandNoIDError",
                                    "CommandNoNameError");
    });

    describe("CommandAlreadyExistingIDError", function() {
        shouldBeAnError(Errors.CommandAlreadyExistingIDError, "CommandAlreadyExistingIDError", true, Error);

        it("has an id property", function() {
            expect(new Errors.CommandAlreadyExistingIDError("Test Error", 1)).to.have.property("id").and.to.equal(1);
            expect(new Errors.CommandAlreadyExistingIDError("Test Error", "test")).to.have.property("id").and.to.equal("test");
        });
    });

    describe("CommandNoIDError", function() {
        shouldBeAnError(Errors.CommandNoIDError, "CommandNoIDError", true, Error);
    });

    describe("CommandNoNameError", function() {
        shouldBeAnError(Errors.CommandNoNameError, "CommandNoNameError", true, Error);

        it("has an id property", function() {
            expect(new Errors.CommandNoNameError("Test Error", 1)).to.have.property("id").and.to.be.equal(1);
            expect(new Errors.CommandNoNameError("Test Error", "test")).to.have.property("id").and.to.be.equal("test");
        });
    });
});