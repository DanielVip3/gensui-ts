import { CommandSideEffect } from "../../classes/commands/CommandConsumer";

export default class CommandSideEffectMock extends CommandSideEffect {
    public stub: Function;
    public callStub: boolean;

    constructor(stub, callStub) {
        super();

        this.stub = stub;
        this.callStub = callStub;
    }

    public effect(context) {
        if (this.stub) this.stub(context);

        if (!context.data) context.data = {};
        context.data.testDone = true;
    }
};