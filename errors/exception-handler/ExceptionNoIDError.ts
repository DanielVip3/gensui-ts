/* Called when an exception handler is instantiated and it doesn't have an id to identify its command */
export default class CommandNoIDError extends Error {
    constructor(m: string) {
        super(m);
        
        this.name = "ExceptionNoIDError";
    }
}