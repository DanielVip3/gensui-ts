import GlobalHookError from "./GlobalHookError";

/* Called when an error happens when adding global hooks (filters, interceptors, consumers) to events */
export default class EventGlobalHookError extends GlobalHookError {
    constructor(m: string) {
        super(m);
        
        this.name = "EventGlobalHookError";
    }
}