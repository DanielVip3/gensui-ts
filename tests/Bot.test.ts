import Bot from "../classes/Bot";

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

describe("Bot", function() {
    it("instantiates", function() {
        expect(new Bot({
            name: "test",
            token: "test"
        })).to.be.instanceof(Bot);
    });

    it("throws error if a bot name is not passed", function() {
        //@ts-ignore
        expect(() => new Bot({
            token: "test"
        })).to.throw("name");
    });

    it("throws error if a bot token is not passed", function() {
        //@ts-ignore
        expect(() => new Bot({
            name: "test",
        })).to.throw("token");
    });
});