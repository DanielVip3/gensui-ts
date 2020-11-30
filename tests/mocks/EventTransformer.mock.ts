import { ClientEvents } from "discord.js";
import { EventTransformer } from "../../classes/events/EventInterceptor";

export default class EventTransformerMock<K extends keyof ClientEvents> extends EventTransformer<K> {
    public stub: Function;
    public callStub: boolean;

    constructor(stub, callStub) {
        super();

        this.stub = stub;
        this.callStub = callStub;
    }

    public transform(payload, context) {
        if (this.stub) this.stub(payload, context);
        context.testDone = true;
    }
};