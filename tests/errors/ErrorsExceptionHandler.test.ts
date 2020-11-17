import * as Errors from '../../errors';
import { expect } from 'chai';
import { shouldBeAnError } from './ErrorTestGenerics';

describe("Exception Handler's errors", function() {
    it("exports all existing events errors correctly", function() {
        expect(Errors).to.have.property("ExceptionNoIDError");
        expect(Errors).to.have.property("ExceptionNoReferenceError");
    });

    describe("ExceptionNoIDError", function() {
        shouldBeAnError(Errors.ExceptionNoIDError, "ExceptionNoIDError", true, Error);
    });

    describe("ExceptionNoReferenceError", function() {
        shouldBeAnError(Errors.ExceptionNoReferenceError, "ExceptionNoReferenceError", true, Error);
    });
});