import * as Errors from '../../errors';
import { expect } from 'chai';
import { shouldBeAGenericError, shouldBeAnError } from './ErrorTestGenerics';

describe("Interceptors' errors", function() {
    it("exports all existing interceptor errors correctly", function() {
        expect(Errors).to.include.keys("CooldownError",
                                    "GenericInterceptorError");
    });

    describe("CooldownError", function() {
        shouldBeAnError(Errors.CooldownError, "CooldownError", true, Errors.GenericInterceptorError);

        it("doesn't have a default remaining time if not specified", function() {
            expect(new Errors.CooldownError("Test error")).to.not.have.property("remaining");
        });

        it("correctly counts remaining cooldown time", function() {
            const now: Date = new Date();
            expect(new Errors.CooldownError("Test error", now, 60 * 60 * 1000)).to.have.property("remaining").which.is.closeTo((new Date().getTime() - new Date(now.getTime() + (60 * 60 * 1000)).getTime()), 1);
        });
    });

    describe("GenericInterceptorError", function() {
        shouldBeAGenericError(Errors.GenericInterceptorError);
    });
});