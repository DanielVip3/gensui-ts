import { InlineCommandInterceptor } from '../../interceptors/Interceptors';
import { Command, CommandContext } from '../../classes/commands/Command';
import { CommandCallOptions } from '../../classes/commands/CommandCallOptions';
import { CommandInterceptorResponse } from '../../classes/commands/CommandInterceptor';
import { Client, Guild, Message, SnowflakeUtil, TextChannel, User } from 'discord.js';

import * as chai from 'chai';
import { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import * as sinon from 'sinon';

import shouldBeAnInterceptor from './InterceptorTestGenerics';

const discordClientMock = new Client();
const messageMock = new Message(discordClientMock, { id: SnowflakeUtil.generate() }, new TextChannel(new Guild(discordClientMock, { id: SnowflakeUtil.generate() }), { id: SnowflakeUtil.generate(), nsfw: true }));
const commandMock: Command = new Command({
    id: "test",
    names: "test",
    handler: sinon.fake(),
});
const commandCallOptionsMock = { prefix: "!", name: "test", mentionHandled: false, rawArguments: [], arguments: [] } as CommandCallOptions;
const commandContextMock = { command: commandMock, message: messageMock, call: commandCallOptionsMock } as CommandContext;

const interceptorResponseMock = { next: true } as CommandInterceptorResponse;

describe("Commands built-in filters", function() {
    describe("InlineFilter", function() {
        shouldBeAnInterceptor(InlineCommandInterceptor, [sinon.stub().returns(interceptorResponseMock)], [commandContextMock]);

        it("accepts and calls a callback with correct parameters", async function() {
            const callback = sinon.stub().returns(interceptorResponseMock);
            const interceptor: InlineCommandInterceptor = new InlineCommandInterceptor(callback);

            await interceptor.intercept(commandContextMock);

            sinon.assert.calledWith(callback, commandContextMock);
        });
    });
});