import IORedis from 'ioredis-mock';
import { MemoryCooldownStore, RedisCooldownStore, CooldownStoreObject } from '../classes/utils/CooldownStores';
import { expect } from 'chai';

describe("Memory Cooldown Store (with max times = 1)", function() {
    it("instantiates", function() {
        expect(new MemoryCooldownStore()).to.be.an.instanceof(MemoryCooldownStore);
    });

    it("has a default cooldownTime parameter which is 1 hour", function() {
        expect(new MemoryCooldownStore()).to.have.property("cooldownTime", 60 * 60 * 1000);
    });

    it("has a default maxTimes parameter which is 1", function() {
        expect(new MemoryCooldownStore()).to.have.property("maxTimes", 1);
    });

    it("getCooldown returns null if no userId is passed", function() {
        const store = new MemoryCooldownStore();

        //@ts-ignore
        expect(store.getCooldown()).to.be.null;
    });

    it("getCooldown returns undefined if unexisting userId is passed", async function() {
        const store = new MemoryCooldownStore();

        expect(store.getCooldown("blahblah")).to.be.undefined;
    });

    it("isInCooldown returns false if no userId is passed", function() {
        const store = new MemoryCooldownStore();

        //@ts-ignore
        expect(store.isInCooldown()).to.be.false;
    });

    it("isInCooldown returns false if unexisting userId is passed", async function() {
        const store = new MemoryCooldownStore();

        expect(store.isInCooldown("blahblah")).to.be.false;
    });

    it("deleteCooldown returns false if no userId is passed", function() {
        const store = new MemoryCooldownStore();

        //@ts-ignore
        expect(store.deleteCooldown()).to.be.false;
    });

    it("deleteCooldown returns false if unexisting userId is passed", async function() {
        const store = new MemoryCooldownStore();

        expect(store.deleteCooldown("blahblah")).to.be.false;
    });

    it("adds user in cooldown correctly", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
        });

        store.increaseCooldown("testUserID");

        expect(store.isInCooldown("testUserID")).to.be.true;

        done();
    });

    it("has user in store", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
        });

        store.increaseCooldown("testUserID");

        //@ts-ignore
        expect(store.store["testUserID"]).to.be.ok;

        done();
    });

    it("sets different called date correctly when increasing cooldown", function() {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        store.increaseCooldown("testUserID", tomorrow);

        expect(store.getCooldown("testUserID")).to.have.property("called", tomorrow);
    });

    it("resets correctly if cooldown is increased but max limits is reached", function(done) {
        const store = new MemoryCooldownStore({
            maxTimes: 3,
        });

        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");

        expect(store.getCooldown("testUserID")).to.have.property("times").which.equals(2);

        store.increaseCooldown("testUserID"); // reaches 3
        store.increaseCooldown("testUserID"); // goes back to 1

        expect(store.getCooldown("testUserID")).to.have.property("times").which.equals(1);

        done();
    });

    it("resets correctly if cooldown is increased but already expired", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
        });

        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");

        expect(store.getCooldown("testUserID")).to.have.property("times").which.equals(2);

        setTimeout(() => { // time expires
            store.increaseCooldown("testUserID"); // goes back to 1

            expect(store.getCooldown("testUserID")).to.have.property("times").which.equals(1);

            done();
        }, 1500);
    });

    it("resets correctly the cooldown when fetching if the user is in cooldown and cooldown is expired", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
        });

        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");

        setTimeout(() => {
            expect(store.isInCooldown("testUserID")).to.be.false;

            done();
        }, 1500);
    });

    it("gets correct user data", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
        });

        store.increaseCooldown("testUserID");

        const cooldown: CooldownStoreObject|null = store.getCooldown("testUserID");
        expect(cooldown).to.include({ times: 1 });
        expect(cooldown).to.have.property('called');

        done();
    });

    it("expires user in cooldown correctly", function(done) {
        this.timeout(5000);

        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 seconds
        });

        store.increaseCooldown("testUserID");

        setTimeout(() => {
            expect(store.isInCooldown("testUserID")).to.be.false;

            done();
        }, 1500);
    });

    it("deletes user from cooldown correctly", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
        });

        store.increaseCooldown("testUserID");

        expect(store.deleteCooldown("testUserID")).to.be.true;
        expect(store.isInCooldown("testUserID")).to.be.false;

        expect(store.deleteCooldown("unexistingUserID")).to.be.false;

        done();
    });

    it("false is returned when unexisting user's cooldown is tried to be deleted", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
        });

        expect(store.deleteCooldown("unexistingUserID")).to.be.false;

        done();
    });

    it("fully clears itself correctly", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
        });

        store.increaseCooldown("testUserID");

        expect(store.clear()).to.be.true;

        done();
    });
});

describe("Memory Cooldown Store (with max times = 3)", function() {
    it("adds user in cooldown correctly", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
        });

        store.increaseCooldown("testUserID");
        expect(store.isInCooldown("testUserID")).to.be.false;

        done();
    });
    
    it("has user in store", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
        });

        store.increaseCooldown("testUserID");

        //@ts-ignore
        expect(store.store["testUserID"]).to.be.ok;

        done();
    });

    it("gets correct user data", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3
        });

        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");

        const cooldown: CooldownStoreObject|null = store.getCooldown("testUserID");
        expect(cooldown).to.include({ times: 2 });
        expect(cooldown).to.have.property('called');

        done();
    });

    it("invalidates user in cooldown correctly due to max times reached", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
        });

        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");

        expect(store.isInCooldown("testUserID")).to.be.false;

        store.increaseCooldown("testUserID");

        expect(store.isInCooldown("testUserID")).to.be.true;

        done();
    });

    it("expires user in cooldown correctly", function(done) {
        this.timeout(5000);

        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 seconds
            maxTimes: 3,
        });

        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");

        expect(store.isInCooldown("testUserID")).to.be.true;
        
        setTimeout(() => {
            expect(store.isInCooldown("testUserID")).to.be.false;

            done();
        }, 1500);
    });

    it("fully clears itself correctly", function(done) {
        const store = new MemoryCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
        });

        store.increaseCooldown("testUserID");

        expect(store.clear()).to.be.true;
        //@ts-ignore
        expect(store.store["testUserID"]).to.not.be.ok;

        done();
    });
});

describe("Redis Cooldown Store (with max times = 1)", function() {
    it("instantiates", function() {
        expect(new RedisCooldownStore({
            store: new IORedis(),
            cooldownIdentifierKey: "test"
        })).to.be.an.instanceof(RedisCooldownStore);
    });

    it("throws error if no options are provided", function() {
        expect(function() {
            //@ts-ignore
            new RedisCooldownStore();
        }).to.throw("options");
    });

    it("has a default cooldownTime parameter which is 1 hour", function() {
        expect(new RedisCooldownStore({
            store: new IORedis(),
            cooldownIdentifierKey: "test"
        })).to.have.property("cooldownTime", 60 * 60 * 1000);
    });

    it("has a default maxTimes parameter which is 1", function() {
        expect(new RedisCooldownStore({
            store: new IORedis(),
            cooldownIdentifierKey: "test"
        })).to.have.property("maxTimes", 1);
    });
    
    it("has a default maxTimes parameter which is 1", function() {
        expect(new RedisCooldownStore({
            store: new IORedis(),
            cooldownIdentifierKey: "test"
        })).to.have.property("maxTimes", 1);
    });

    it("has a default cooldownHashKey which is bots.commands.cooldown", function() {
        const store1 = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            cooldownIdentifierKey: "test",
        });

        expect(store1).to.have.property("cooldownHashKey", "bot.commands.cooldown.test"); // due to the fact that cooldownHashKey and cooldownIdentifierKey get joint with a dot, they are tested joint
    });

    it("throws error if no store has been provided", function() {
        expect(function() {
            //@ts-ignore
            new RedisCooldownStore({
                cooldownTime: 1 * 1000, // 1 second
                cooldownHashKey: "TEST.bot.commands.cooldown",
                cooldownIdentifierKey: "test"
            });
        }).to.throw("store");
    });

    it("throws error if no cooldownIdentifierKey is provided", function() {
        expect(function() {
            //@ts-ignore
            new RedisCooldownStore({
                store: new IORedis(),
            });
        }).to.throw("cooldownIdentifierKey");
    });

    it("joins cooldownHashKey with cooldownIdentifierKey", function(done) {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        /* Ends with "test" because of constructor concatenation of cooldownHashKey+cooldownIdentifierKey */
        //@ts-ignore
        expect(store.cooldownHashKey).to.be.equal("TEST.bot.commands.cooldown.test");

        done();
    });

    it("getCooldown returns null if no userId is passed", async function() {
        const store = new RedisCooldownStore({
            store: new IORedis(),
            cooldownIdentifierKey: "test"
        });

        //@ts-ignore
        expect(await store.getCooldown()).to.be.null;
    });

    it("getCooldown returns undefined if unexisting userId is passed", async function() {
        const store = new RedisCooldownStore({
            store: new IORedis(),
            cooldownIdentifierKey: "test"
        });

        //@ts-ignore
        expect(await store.getCooldown("blahblah")).to.be.undefined;
    });

    it("isInCooldown returns false if no userId is passed", async function() {
        const store = new RedisCooldownStore({
            store: new IORedis(),
            cooldownIdentifierKey: "test"
        });

        //@ts-ignore
        expect(await store.isInCooldown()).to.be.false;
    });

    it("isInCooldown returns false if unexisting userId is passed", async function() {
        const store = new RedisCooldownStore({
            store: new IORedis(),
            cooldownIdentifierKey: "test"
        });

        expect(await store.isInCooldown("blahblah")).to.be.false;
    });

    it("deleteCooldown returns false if no userId is passed", async function() {
        const store = new RedisCooldownStore({
            store: new IORedis(),
            cooldownIdentifierKey: "test"
        });

        //@ts-ignore
        expect(await store.deleteCooldown()).to.be.false;
    });

    it("deleteCooldown returns false if unexisting userId is passed", async function() {
        const store = new RedisCooldownStore({
            store: new IORedis(),
            cooldownIdentifierKey: "test"
        });

        expect(await store.deleteCooldown("blahblah")).to.be.false;
    });

    it("adds user in cooldown correctly", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");

        expect(await store.isInCooldown("testUserID")).to.be.true;
    });

    it("has user and correct data in store", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");

        //@ts-ignore
        let user: string = await store.store.get(`${store.cooldownHashKey}.testUserID`);
        expect(user).to.be.a("string");
        user = JSON.parse(user);
        expect(user).to.include({ times: 1 });
        expect(user).to.have.property('called');
    });

    it("sets different called date correctly when increasing cooldown", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);

        await store.increaseCooldown("testUserID", tomorrow);

        expect(await store.getCooldown("testUserID")).to.have.property("called", tomorrow.toJSON()); // dates in JSONs are converted with toJSON to be saved in Redis, so let's compare them using toJSON
    });

    it("resets correctly if cooldown is increased but max limits is reached", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            maxTimes: 3,
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");
        await store.increaseCooldown("testUserID");

        expect(await store.getCooldown("testUserID")).to.have.property("times").which.equals(2);

        await store.increaseCooldown("testUserID"); // reaches 3
        await store.increaseCooldown("testUserID"); // goes back to 1

        expect(await store.getCooldown("testUserID")).to.have.property("times").which.equals(1);
    });

    it("resets correctly if cooldown is increased but already expired", function(done) {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            maxTimes: 3,
            cooldownIdentifierKey: "test",
        });

        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");

        setTimeout(async() => { // time expires
            await store.increaseCooldown("testUserID"); // goes back to 1

            expect(await store.getCooldown("testUserID")).to.have.property("times").which.equals(1);

            done();
        }, 1500);
    });

    it("resets correctly the cooldown when fetching if the user is in cooldown and cooldown is expired", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            maxTimes: 3,
            cooldownIdentifierKey: "test",
        });

        await store.increaseCooldown("testUserID2");
        await store.increaseCooldown("testUserID2");
        await store.increaseCooldown("testUserID2");

        new Promise((resolve) => setTimeout(async() => {
            expect(await store.isInCooldown("testUserID2")).to.be.false;
            resolve(true);
        }, 1500));
    });

    it("gets correct user data", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");

        const cooldown: CooldownStoreObject|null|undefined = await store.getCooldown("testUserID");
        expect(cooldown).to.be.ok.and.to.include({ times: 1 });
        expect(cooldown).to.be.ok.and.to.have.property('called');
    });

    it("expires user in cooldown correctly", function(done) {
        this.timeout(10000);

        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 seconds
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        store.increaseCooldown("testUserID");

        setTimeout(async() => {
            expect(await store.isInCooldown("testUserID")).to.be.false;
            done();
        }, 1500);
    });

    it("deletes user from cooldown correctly", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");

        expect(await store.deleteCooldown("testUserID")).to.be.true;
        expect(await store.isInCooldown("testUserID")).to.be.false;
    });

    it("fully clears itself correctly", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");

        await store.clear();

        //@ts-ignore
        expect(await store.store.get(`${store.cooldownHashKey}.testUserID`)).to.not.be.ok;
    });
});

describe("Redis Cooldown Store (with max times = 3)", function() {
    it("throws error if no store has been provided", function() {
        expect(function() {
            //@ts-ignore
            new RedisCooldownStore({
                cooldownTime: 1 * 1000, // 1 second
                maxTimes: 3,
                cooldownHashKey: "TEST.bot.commands.cooldown",
                cooldownIdentifierKey: "test"
            });
        }).to.throw("store");
    });

    it("adds user in cooldown correctly", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");
        await store.increaseCooldown("testUserID");

        expect(await store.isInCooldown("testUserID")).to.be.false;
    });

    it("has user and correct data in store", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");

        //@ts-ignore
        let user: string = await store.store.get(`${store.cooldownHashKey}.testUserID`);
        expect(user).to.be.a("string");
        user = JSON.parse(user);
        expect(user).to.include({ times: 1 });
        expect(user).to.have.property('called');
    });

    it("gets correct user data", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");
        await store.increaseCooldown("testUserID");

        const cooldown: CooldownStoreObject|null|undefined = await store.getCooldown("testUserID");
        expect(cooldown).to.be.ok.and.to.include({ times: 2 });
        expect(cooldown).to.be.ok.and.to.have.property('called');
    });

    it("invalidates user in cooldown correctly due to max times reached", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");
        await store.increaseCooldown("testUserID");

        expect(await store.isInCooldown("testUserID")).to.be.false;

        await store.increaseCooldown("testUserID");

        expect(await store.isInCooldown("testUserID")).to.be.true;
    });

    it("expires user in cooldown correctly", function(done) {
        this.timeout(5000);

        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 seconds
            maxTimes: 3,
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");
        store.increaseCooldown("testUserID");

        setTimeout(async() => {
            expect(await store.isInCooldown("testUserID")).to.be.false;
            done();
        }, 1500);
    });

    it("deletes user from cooldown correctly", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");
        await store.increaseCooldown("testUserID");
        await store.increaseCooldown("testUserID");

        expect(await store.deleteCooldown("testUserID")).to.be.true;
        expect(await store.isInCooldown("testUserID")).to.be.false;
    });

    it("false is returned when unexisting user's cooldown is tried to be deleted", async function () {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        expect(await store.deleteCooldown("unexistingUserID")).to.be.false;
    });

    it("fully clears itself correctly", async function() {
        const store = new RedisCooldownStore({
            cooldownTime: 1 * 1000, // 1 second
            maxTimes: 3,
            store: new IORedis(),
            cooldownHashKey: "TEST.bot.commands.cooldown",
            cooldownIdentifierKey: "test"
        });

        await store.increaseCooldown("testUserID");

        await store.clear();

        //@ts-ignore
        expect(await store.store.get(`${store.cooldownHashKey}.testUserID`)).to.not.be.ok;
    });
});