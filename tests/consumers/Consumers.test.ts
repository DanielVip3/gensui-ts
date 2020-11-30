import { Consumers, InlineCommandConsumer, InlineEventConsumer, LogConsumer } from '../../consumers/Consumers';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

describe("Built-in consumers exports", function() {
    it("exports both kinds of events and commands consumers correctly", function() {
        expect(Consumers).to.have.keys("Events", "Commands");
    });

    describe("Commands consumers exports", function() {
        it("exports all command consumers methods correctly", function() {
            /* Here I can't use ".to.have.keys" because those exports are static methods so they aren't keys but properties of the class. */
            expect(Consumers.Commands).to.have.property("Inline");
            expect(Consumers.Commands).to.have.property("Log");
        });

        it("exports all shorthand consumers getters correctly", function() {
            /* Here I can't use ".to.have.keys" because those exports are static methods so they aren't keys but properties of the class. */
            expect(Consumers.Commands).to.have.property("_Log");
        });

        describe("Inline method", function() {
            it("returns correct consumer", function() {
                expect(Consumers.Commands.Inline(sinon.fake())).to.be.an.instanceof(InlineCommandConsumer);
            });
        });

        describe("Log method", function() {
            it("returns correct consumer", function() {
                expect(Consumers.Commands.Log()).to.be.an.instanceof(LogConsumer);
            });
        });
    });
    
    describe("Events consumers exports", function() {
        it("exports all command consumers methods correctly", function() {
            /* Here I can't use ".to.have.keys" because those exports are static methods so they aren't keys but properties of the class. */
            expect(Consumers.Events).to.have.property("Inline");
        });

        describe("Inline method", function() {
            it("returns correct consumer", function() {
                expect(Consumers.Events.Inline(sinon.fake())).to.be.an.instanceof(InlineEventConsumer);
            });
        });
    });
});