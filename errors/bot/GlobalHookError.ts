/* Called when an error happens when adding global hooks (filters, interceptors, consumers) */
export default class GlobalHookError extends Error {
    constructor(m: string) {
        super(m);
        
        this.name = "GlobalHookError";
    }
}