import { CommandTransformer } from "../../classes/commands/CommandInterceptor";

export default class CommandTransformerMock extends CommandTransformer {
    public stub: Function;
    public callStub: boolean;

    constructor(stub, callStub) {
        super();

        this.stub = stub;
        this.callStub = callStub;
    }

    public transform(context) {
        if (this.stub) this.stub(context);
        context.testDone = true;
    }
};