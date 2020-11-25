import * as Errors from '../../errors';
import { expect } from 'chai';
import { shouldBeAGenericError, shouldBeAnError } from './ErrorTestGenerics';

describe("Consumers' errors", function() {
    it("exports all existing consumer errors correctly", function() {
        expect(Errors).to.include.keys("LogError",
                                    "GenericConsumerError");
    });

    describe("LogError", function() {
        shouldBeAnError(Errors.LogError, "LogError", true, Errors.GenericConsumerError);
    });

    describe("GenericConsumerError", function() {
        shouldBeAGenericError(Errors.GenericConsumerError);
    });
});