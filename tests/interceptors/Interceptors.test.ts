import { Interceptors, InlineCommandInterceptor, InlineEventInterceptor, CooldownInterceptor } from '../../interceptors/Interceptors';
import { MemoryCooldownStore } from '../../classes/utils/CooldownStores';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

describe("Built-in interceptors exports", function() {
    it("exports both kinds of events and commands interceptors correctly", function() {
        expect(Interceptors).to.have.keys("Events", "Commands");
    });

    describe("Commands filters exports", function() {
        it("exports all command interceptors methods correctly", function() {
            /* Here I can't use ".to.have.keys" because those exports are static methods so they aren't keys but properties of the class. */
            expect(Interceptors.Commands).to.have.property("Inline");
            expect(Interceptors.Commands).to.have.property("Cooldown");
        });

        /*
        it("exports all shorthand interceptors getters correctly", function() {
            * Command interceptors do not have shorthand getters for now. *
        });
        */

        describe("Inline method", function() {
            it("returns correct interceptor", function() {
                expect(Interceptors.Commands.Inline(sinon.fake())).to.be.an.instanceof(InlineCommandInterceptor);
            });
        });

        describe("Cooldown method", function() {
            it("returns correct interceptor", function() {
                expect(Interceptors.Commands.Cooldown(new MemoryCooldownStore())).to.be.an.instanceof(CooldownInterceptor);
            });
        });
    });
    
    describe("Events interceptors exports", function() {
        it("exports all command interceptors methods correctly", function() {
            /* Here I can't use ".to.have.keys" because those exports are static methods so they aren't keys but properties of the class. */
            expect(Interceptors.Events).to.have.property("Inline");
        });

        /*
        it("exports all shorthand interceptors getters correctly", function() {
            * Events interceptors do not have shorthand getters for now. *
        });
        */

        describe("Inline method", function() {
            it("returns correct interceptor", function() {
                expect(Interceptors.Events.Inline(sinon.fake())).to.be.an.instanceof(InlineEventInterceptor);
            });
        });
    });
});