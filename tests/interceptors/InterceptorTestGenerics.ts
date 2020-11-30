import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

/*
* Being an interceptor a class which implements a generic abstract class which exists only in TypeScript, we can't test at runtime that an interceptor class implements the abstract class.
* So, we'll use a simple duck checking system: if it looks like an interceptor, has an intercept method like an interceptor, and has an handleError method like an interceptor, then probably is an interceptor.
*
* This function expects "parameters" to be the actual parameters which would return next as true, when combined with "passedInterceptorOptions". If they're wrong and they don't return next as true, tests do fail.
*/
export default function shouldBeAnInterceptor(interceptor: any, parameters: any[], passedInterceptorOptions: any[]) {
    it("instantiates", function() {
        expect(new interceptor(...parameters)).to.be.instanceOf(interceptor);
    });

    it("has an intercept method", function() {
        expect(new interceptor(...parameters, true)).to.have.property("intercept");
    });

    it("intercept method returns an interceptor response object", async function() {
        expect(await (new interceptor(...parameters)).intercept(...passedInterceptorOptions)).to.be.an("object");
    });

    it("intercept method returns an interceptor response object with next parameter as boolean", async function() {
        expect(await (new interceptor(...parameters)).intercept(...passedInterceptorOptions)).to.have.property("next").which.is.a("boolean");
    });

    it("intercept method returns an interceptor response object with data parameter as undefined or object", async function() {
        const response = await new interceptor(...parameters);
        expect(response['data']).to.satisfy(data => !!["object", "undefined"].includes(typeof data));
    });
};