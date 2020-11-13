import GlobalHookError from "./GlobalHookError";

/* Called when an error happens when adding global hooks (filters, interceptors, consumers) to commands */
export default class CommandGlobalHookError extends GlobalHookError {
    constructor(m: string) {
        super(m);
        
        this.name = "CommandGlobalHookError";
    }
}