import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

/*
* Being a filter a class which implements a generic abstract class which exists only in TypeScript, we can't test at runtime that a filter class implements the abstract class.
* So, we'll use a simple duck checking system: if it looks like a filter, has a filter method like a filter, and has an handleError method like a filter, then probably is a filter.
*
* This function expects "parameters" to be the actual parameters which would return true, when combined with "passedFilterOptions". If they're wrong and they don't return true, tests do fail.
* "parameters" SHOULD NOT specify the "whitelist" parameter (the last one) because it gets specified and tested automatically in this function.
*/
export default function shouldBeAFilter(filter: any, parameters: any[], passedFilterOptions: any[], shouldThrowErrorIfFalse: boolean = false, thrownError: any = null) {
    it("instantiates", function() {
        expect(new filter(...parameters)).to.be.instanceOf(filter);
    });

    it("accepts whitelist property", function() {
        expect(new filter(...parameters, true)).to.have.property("whitelist", true);
    });

    it("has filter method", function() {
        expect(new filter(...parameters, true)).to.have.property("filter");
    });

    it("has handleError method", function() {
        expect(new filter(...parameters, true)).to.have.property("handleError");
    });

    it("filter method returns boolean", async function() {
        expect(typeof await (new filter(...parameters, true)).filter(...passedFilterOptions) === "boolean").to.be.true;
    });

    it("filter method reverses returned boolean if whitelist is true", async function() {
        const falseWhitelistCall = await (new filter(...parameters, false)).filter(...passedFilterOptions);
        const trueWhitelistCall = await (new filter(...parameters, true)).filter(...passedFilterOptions);
        expect(falseWhitelistCall).to.be.equal(!trueWhitelistCall);
    });

    if (shouldThrowErrorIfFalse && thrownError) {
        it("throws error from handleError when returned result is false", function() {
            const filterH = new filter(...parameters, true);
            const result = filterH.filter(...passedFilterOptions);
            expect(() => filterH.handleError(!result, ...parameters)).to.throw(thrownError);
        });
    }
};