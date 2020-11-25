import { Filters, InlineCommandFilter, DMFilter, GuildsFilter, NSFWFilter, TextChannelsFilter, InlineEventFilter } from '../../filters/Filters';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

describe("Built-in filters exports", function() {
    it("exports both kinds of events and commands filters correctly", function() {
        expect(Filters).to.have.keys("Events", "Commands");
    });

    describe("Commands filters exports", function() {
        it("exports all command filters methods correctly", function() {
            /* Here I can't use ".to.have.keys" because those exports are static methods so they aren't keys but properties of the class. */
            expect(Filters.Commands).to.have.property("Inline");
            expect(Filters.Commands).to.have.property("DM");
            expect(Filters.Commands).to.have.property("Guilds");
            expect(Filters.Commands).to.have.property("NSFW");
            expect(Filters.Commands).to.have.property("TextChannels");
        });

        it("exports all shorthand filters getters correctly", function() {
            /* Here I can't use ".to.have.keys" because those exports are static methods so they aren't keys but properties of the class. */
            expect(Filters.Commands).to.have.property("_DM");
            expect(Filters.Commands).to.have.property("_NSFW");
        });

        describe("Inline method", function() {
            it("returns correct filter", function() {
                expect(Filters.Commands.Inline(sinon.fake())).to.be.an.instanceof(InlineCommandFilter);
            });
        });

        describe("DM method", function() {
            it("returns correct filter", function() {
                expect(Filters.Commands.DM()).to.be.an.instanceof(DMFilter);
            });
        });

        describe("Guilds method", function() {
            it("returns correct filter", function() {
                expect(Filters.Commands.Guilds(["test", "test"])).to.be.an.instanceof(GuildsFilter);
            });
        });

        describe("NSFW method", function() {
            it("returns correct filter", function() {
                expect(Filters.Commands.NSFW()).to.be.an.instanceof(NSFWFilter);
            });
        });

        describe("TextChannels method", function() {
            it("returns correct filter", function() {
                expect(Filters.Commands.TextChannels(["test", "test"])).to.be.an.instanceof(TextChannelsFilter);
            });
        });
    });
    
    describe("Events filters exports", function() {
        it("exports all command filters methods correctly", function() {
            /* Here I can't use ".to.have.keys" because those exports are static methods so they aren't keys but properties of the class. */
            expect(Filters.Events).to.have.property("Inline");
        });

        describe("Inline method", function() {
            it("returns correct filter", function() {
                expect(Filters.Events.Inline(sinon.fake())).to.be.an.instanceof(InlineEventFilter);
            });
        });
    });
});