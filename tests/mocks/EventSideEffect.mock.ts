import { ClientEvents } from "discord.js";
import { EventSideEffect } from "../../classes/events/EventConsumer";

export default class EventSideEffectMock<K extends keyof ClientEvents> extends EventSideEffect<K> {
    public stub: Function;
    public callStub: boolean;

    constructor(stub, callStub) {
        super();

        this.stub = stub;
        this.callStub = callStub;
    }

    public effect(payload, context) {
        if (this.stub) this.stub(payload, context);
        context.testDone = true;
    }
};