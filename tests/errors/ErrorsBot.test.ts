import * as Errors from '../../errors';
import { expect } from 'chai';
import { shouldBeAnError } from './ErrorTestGenerics.test';

describe("Bot's errors", function() {
    it("exports all existing bot errors correctly", function() {
        expect(Errors).to.include.keys("EventGlobalHookError",
                                    "CommandGlobalHookError",
                                    "GlobalHookError");
    });

    describe("CommandGlobalHookError", function() {
        shouldBeAnError(Errors.CommandGlobalHookError, "CommandGlobalHookError", true, Errors.GlobalHookError);
    });

    describe("EventGlobalHookError", function() {
        shouldBeAnError(Errors.EventGlobalHookError, "EventGlobalHookError", true, Errors.GlobalHookError);
    });

    describe("GlobalHookError", function() {
        shouldBeAnError(Errors.GlobalHookError, "GlobalHookError");
    });
});