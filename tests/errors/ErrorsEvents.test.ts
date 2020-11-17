import * as Errors from '../../errors';
import { expect } from 'chai';
import { shouldBeAnError } from './ErrorTestGenerics';

describe("Events' errors", function() {
    it("exports all existing events errors correctly", function() {
        expect(Errors).to.have.property("EventAlreadyExistingIDError");
        expect(Errors).to.have.property("EventNoIDError");
        expect(Errors).to.have.property("EventNoTypeError");
    });

    describe("EventAlreadyExistingIDError", function() {
        shouldBeAnError(Errors.EventAlreadyExistingIDError, "EventAlreadyExistingIDError", true, Error);

        it("has an id property", function() {
            expect(new Errors.EventAlreadyExistingIDError("Test Error", 1)).to.have.property("id").and.to.equal(1);
            expect(new Errors.EventAlreadyExistingIDError("Test Error", "test")).to.have.property("id").and.to.equal("test");
        });
    });

    describe("EventNoIDError", function() {
        shouldBeAnError(Errors.EventNoIDError, "EventNoIDError", true, Error);
    });

    describe("EventNoTypeError", function() {
        shouldBeAnError(Errors.EventNoTypeError, "EventNoTypeError", true, Error);
    });
});