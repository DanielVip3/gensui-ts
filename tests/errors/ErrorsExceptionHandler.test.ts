import * as Errors from '../../errors';
import { expect } from 'chai';
import { shouldBeAnError } from './ErrorTestGenerics.test';

describe("Exception Handler's errors", function() {
    it("exports all existing events errors correctly", function() {
        expect(Errors).to.include.keys("ExceptionNoIDError",
                                    "ExceptionNoReferenceError");
    });

    describe("ExceptionNoIDError", function() {
        shouldBeAnError(Errors.ExceptionNoIDError, "ExceptionNoIDError", true, Error);
    });

    describe("ExceptionNoReferenceError", function() {
        shouldBeAnError(Errors.ExceptionNoReferenceError, "ExceptionNoReferenceError", true, Error);
    });
});