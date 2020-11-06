import * as Errors from '../errors';
import { expect } from 'chai';
import { TextChannel, Guild, Client } from 'discord.js';

describe("Errors", function() {
    it("imports all existing errors correctly", function() {
        expect(Errors).to.have.property("CommandCooldownError");
        expect(Errors).to.have.property("CommandNoIDError");
        expect(Errors).to.have.property("CommandNoNameError");
        expect(Errors).to.have.property("CommandNSFWError");
    });
    
    describe("CommandCooldownError", function() {
        it("instantiates", function() {
            expect(new Errors.CommandCooldownError("Test error")).to.be.instanceOf(Errors.CommandCooldownError);
        });

        it("has correct name", function() {
            expect(new Errors.CommandCooldownError("Test error")).to.have.property("name").which.is.equal("CommandCooldownError");
        });

        it("throws fine", function() {
            expect(function() { throw new Errors.CommandCooldownError("Test error"); }).to.throw(Errors.CommandCooldownError);
        });

        it("has a working message", function() {
            expect(new Errors.CommandCooldownError("Test error")).to.have.property("message").which.is.equal("Test error");
        });

        it("doesn't have a default remaining time if not specified", function() {
            expect(new Errors.CommandCooldownError("Test error")).to.not.have.property("remaining");
        });

        it("correctly counts remaining cooldown time", function() {
            const now: Date = new Date();
            expect(new Errors.CommandCooldownError("Test error", now, 60 * 60 * 1000)).to.have.property("remaining").which.is.equal((new Date().getTime() - new Date(now.getTime() + (60 * 60 * 1000)).getTime()));
        });
    });

    describe("CommandNoIDError", function() {
        it("instantiates", function() {
            expect(new Errors.CommandNoIDError("Test error")).to.be.instanceOf(Errors.CommandNoIDError);
        });

        it("has correct name", function() {
            expect(new Errors.CommandNoIDError("Test error")).to.have.property("name").which.is.equal("CommandNoIDError");
        });

        it("throws fine", function() {
            expect(function() { throw new Errors.CommandNoIDError("Test error"); }).to.throw(Errors.CommandNoIDError);
        });

        it("has a working message", function() {
            expect(new Errors.CommandNoIDError("Test error")).to.have.property("message").which.is.equal("Test error");
        });

        it("doesn't have any particular property", function() {
            expect(Object.keys(new Errors.CommandNoIDError("Test error"))).to.be.deep.equal(['name']);
        });
    });

    describe("CommandNoNameError", function() {
        it("instantiates", function() {
            expect(new Errors.CommandNoNameError("Test error")).to.be.instanceOf(Errors.CommandNoNameError);
        });

        it("has correct name", function() {
            expect(new Errors.CommandNoNameError("Test error")).to.have.property("name").which.is.equal("CommandNoNameError");
        });

        it("throws fine", function() {
            expect(function() { throw new Errors.CommandNoNameError("Test error"); }).to.throw(Errors.CommandNoNameError);
        });

        it("has a working message", function() {
            expect(new Errors.CommandNoNameError("Test error")).to.have.property("message").which.is.equal("Test error");
        });

        it("doesn't have a default id if not specified", function() {
            expect(new Errors.CommandNoNameError("Test error")).to.not.have.property("id");
        });

        it("correctly shows specified id (string)", function() {
            expect(new Errors.CommandNoNameError("Test error", "testid")).to.have.property("id").which.is.equal("testid");
        });

        it("correctly shows specified id (number)", function() {
            expect(new Errors.CommandNoNameError("Test error", 1323)).to.have.property("id").which.is.equal(1323);
        });
    });

    describe("CommandNSFWError", function() {
        it("instantiates", function() {
            expect(new Errors.CommandNSFWError("Test error")).to.be.instanceOf(Errors.CommandNSFWError);
        });

        it("has correct name", function() {
            expect(new Errors.CommandNSFWError("Test error")).to.have.property("name").which.is.equal("CommandNSFWError");
        });

        it("throws fine", function() {
            expect(function() { throw new Errors.CommandNSFWError("Test error"); }).to.throw(Errors.CommandNSFWError);
        });

        it("has a working message", function() {
            expect(new Errors.CommandNSFWError("Test error")).to.have.property("message").which.is.equal("Test error");
        });

        it("doesn't have a default channel if not specified", function() {
            expect(new Errors.CommandNSFWError("Test error")).to.not.have.property("id");
        });
    });
});