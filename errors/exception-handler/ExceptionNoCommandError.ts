/* Called when an exception handler is instantiated and its id isn't a valid reference to an already existing command */
export default class ExceptionNoCommandError extends Error {
    constructor(m: string) {
        super(m);
        
        this.name = "ExceptionNoCommandrror";
    }
}