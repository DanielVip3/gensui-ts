import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

/*
* Being an consumer a class which implements a generic abstract class which exists only in TypeScript, we can't test at runtime that a consumer class implements the abstract class.
* So, we'll use a simple duck checking system: if it looks like a consumer, has a consume method like a consumer, and has an handleError method like a consumer, then probably is a filter.
*
* This function expects "parameters" to be the actual parameters which would return next as true, when combined with "passedConsumerOptions". If they're wrong and they don't return next as true, tests do fail.
*/
export default function shouldBeAConsumer(consumer: any, parameters: any[], passedConsumerOptions: any[]) {
    it("instantiates", function() {
        expect(new consumer(...parameters)).to.be.instanceOf(consumer);
    });

    it("has an consume method", function() {
        expect(new consumer(...parameters, true)).to.have.property("consume");
    });

    it("consume method returns a consumer response object", async function() {
        expect(await (new consumer(...parameters)).consume(...passedConsumerOptions)).to.be.an("object");
    });

    it("consume method returns a consumer response object with next parameter as boolean", async function() {
        expect(await (new consumer(...parameters)).consume(...passedConsumerOptions)).to.have.property("next").which.is.a("boolean");
    });

    it("consume method returns a consumer response object with data parameter as undefined or object", async function() {
        const response = await (new consumer(...parameters)).consume(...passedConsumerOptions);
        expect(response['data']).to.satisfy(data => !!["object", "undefined"].includes(typeof data));
    });
};