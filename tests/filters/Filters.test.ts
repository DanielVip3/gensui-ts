import { Filters } from '../../filters/Filters';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

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
    });
    
    describe("Events filters exports", function() {
        it("exports all command filters methods correctly", function() {
            /* Here I can't use ".to.have.keys" because those exports are static methods so they aren't keys but properties of the class. */
            expect(Filters.Events).to.have.property("Inline");
        });
    });
});