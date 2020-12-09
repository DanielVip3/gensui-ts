import * as Errors from '../../errors';
import { expect } from 'chai';
import { shouldBeAGenericError, shouldBeAnError } from './ErrorTestGenerics.test';
import * as Discord from 'discord.js';

function shouldBeAFilterError(error) {
    it("whitelist property exists and works correctly", function() {
        expect(new error("Test Error", true)).to.have.property("whitelist").and.to.be.true;
        expect(new error("Test Error", false)).to.have.property("whitelist").and.to.be.false;
    });
}

describe("Filters' errors", function() {
    it("exports all existing filters errors correctly", function() {
        expect(Errors).to.include.keys("DMError",
                                    "GuildsError",
                                    "NSFWError",
                                    "TextChannelsError",
                                    
                                    "GenericFilterError");
    });

    describe("DMError", function() {
        shouldBeAnError(Errors.DMError, "DMError", true, Errors.GenericFilterError);
        shouldBeAFilterError(Errors.DMError);
    });

    describe("GuildsError", function() {
        shouldBeAnError(Errors.GuildsError, "GuildsError", true, Errors.GenericFilterError);
        shouldBeAFilterError(Errors.DMError);

        it("has guilds property", function() {
            const generatedId = Discord.SnowflakeUtil.generate();
            expect(new Errors.GuildsError("Test Error", [generatedId], true)).to.have.property("guilds").and.to.have.members([generatedId]);
        });
    });

    describe("NSFWError", function() {
        shouldBeAnError(Errors.NSFWError, "NSFWError", true, Errors.GenericFilterError);
        shouldBeAFilterError(Errors.DMError);
    });

    describe("TextChannelsError", function() {
        shouldBeAnError(Errors.TextChannelsError, "TextChannelsError", true, Errors.GenericFilterError);
        shouldBeAFilterError(Errors.DMError);

        it("has channels property", function() {
            const generatedId = Discord.SnowflakeUtil.generate();
            expect(new Errors.TextChannelsError("Test Error", [generatedId], true)).to.have.property("channels").and.to.have.members([generatedId]);
        });
    });

    describe("GenericFilterError", function() {
        shouldBeAGenericError(Errors.GenericFilterError);
        shouldBeAFilterError(Errors.DMError);
    });
});