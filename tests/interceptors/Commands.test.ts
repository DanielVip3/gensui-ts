import { CooldownInterceptor, InlineCommandInterceptor } from '../../interceptors/Interceptors';
import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { CommandInterceptorResponse } from '../../classes/commands/CommandInterceptor';
import { MemoryCooldownStore, RedisCooldownStore } from '../../classes/utils/CooldownStores';
import { CooldownError } from '../../errors/interceptors';
import { Client, Guild, Message, SnowflakeUtil, TextChannel, User } from 'discord.js';
import IORedis from 'ioredis-mock';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

import shouldBeAnInterceptor from './InterceptorTestGenerics';

const authorId = SnowflakeUtil.generate();

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate(), author: new User(discordClientMock, { id: authorId }) }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));
const commandMock: Command = new Command({
    id: "test",
    names: "test",
    handler: sinon.fake(),
});
const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: [], arguments: [] } as CommandCallOptions;
const commandContextMock = { command: commandMock, message: messageMock, call: commandCallOptionsMock } as CommandContext;

const memoryStoreMock = new MemoryCooldownStore({
    cooldownTime: 1 * 1000, // 1 second
    maxTimes: 10,
});

const redisStoreMock = new RedisCooldownStore({
    store: new IORedis(),
    cooldownIdentifierKey: "test",
    cooldownTime: 1 * 1000, // 1 second
    maxTimes: 10,
});

const interceptorResponseMock = { next: true } as CommandInterceptorResponse;

describe("Commands built-in interceptors", function() {
    describe("CooldownInterceptor", function() {
        shouldBeAnInterceptor(CooldownInterceptor, [memoryStoreMock], [commandContextMock]);

        it("returns next as true if no message is passed", async function() {
            const interceptor: CooldownInterceptor = new CooldownInterceptor(memoryStoreMock);

            const commandContextNoMessageMock = { command: commandMock, call: commandCallOptionsMock } as CommandContext;
            expect(await interceptor.intercept(commandContextNoMessageMock)).to.be.an("object").which.has.property("next", true);
        });

        it("returns next as true if message has no author", async function() {
            const interceptor: CooldownInterceptor = new CooldownInterceptor(memoryStoreMock);

            const messageNoAuthorMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate() }));
            const commandContextNoAuthorMock = { command: commandMock, message: messageNoAuthorMock, call: commandCallOptionsMock } as CommandContext;
            expect(await interceptor.intercept(commandContextNoAuthorMock)).to.be.an("object").which.has.property("next", true);
        });

        it("has store property", function() {
            const interceptor: CooldownInterceptor = new CooldownInterceptor(memoryStoreMock);
            expect(interceptor).to.have.property("store", memoryStoreMock);
        });

        it("sets command metadata's cooldownStore property as the store", async function() {
            const interceptor: CooldownInterceptor = new CooldownInterceptor(memoryStoreMock);
            await interceptor.intercept(commandContextMock);
            expect(commandMock).to.have.property("metadata").which.has.property("cooldownStore", memoryStoreMock);
        });

        it("accepts both MemoryCooldownStore and RedisCooldownStore", async function() {
            const interceptor1: CooldownInterceptor = new CooldownInterceptor(memoryStoreMock);
            expect(interceptor1).to.have.property("store", memoryStoreMock);

            const interceptor2: CooldownInterceptor = new CooldownInterceptor(redisStoreMock);
            expect(interceptor2).to.have.property("store", redisStoreMock);
        });

        it("returns correct data including store and info properties", async function() {
            const memoryStoreTestingMock = new MemoryCooldownStore({
                cooldownTime: 5 * 1000, // 5 seconds
                maxTimes: 3,
            });

            const interceptor: CooldownInterceptor = new CooldownInterceptor(memoryStoreTestingMock);
            expect(await interceptor.intercept(commandContextMock))
                    .to.have.property("data").which.is.an("object")
                    .and.has.property("cooldown").which.is.an("object")
                    .which.has.keys("store", "info");
        });

        it("increases user's cooldown correctly", async function() {
            const memoryStoreTestingMock = new MemoryCooldownStore({
                cooldownTime: 5 * 1000, // 5 seconds
                maxTimes: 3,
            });

            const interceptor: CooldownInterceptor = new CooldownInterceptor(memoryStoreTestingMock);
            await interceptor.intercept(commandContextMock);
            expect(await memoryStoreTestingMock.getCooldown(authorId)).to.have.property("times", 1);
        });

        it("throws a CooldownError when cooldown is hit", async function() {
            const memoryStoreTestingMock = new MemoryCooldownStore({
                cooldownTime: 5 * 1000, // 5 seconds
                maxTimes: 3,
            });

            const interceptor: CooldownInterceptor = new CooldownInterceptor(memoryStoreTestingMock);
            await interceptor.intercept(commandContextMock);
            await interceptor.intercept(commandContextMock);
            await interceptor.intercept(commandContextMock); // three times, cooldown hit

            await expect(interceptor.intercept(commandContextMock)).to.eventually.be.rejectedWith(CooldownError);
            await expect(await memoryStoreTestingMock.getCooldown(authorId)).to.have.property("times", 3);
        });
    });

    describe("InlineInterceptor", function() {
        shouldBeAnInterceptor(InlineCommandInterceptor, [sinon.stub().returns(interceptorResponseMock)], [commandContextMock]);

        it("accepts and calls a callback with correct parameters", async function() {
            const callback = sinon.stub().returns(interceptorResponseMock);
            const interceptor: InlineCommandInterceptor = new InlineCommandInterceptor(callback);

            await interceptor.intercept(commandContextMock);

            sinon.assert.calledWith(callback, commandContextMock);
        });
    });
});