/* Called when an exception handler is instantiated and its id isn't a valid reference to an already existing command or event */
export default class ExceptionNoReferenceError extends Error {
    constructor(m: string) {
        super(m);
        
        this.name = "ExceptionNoReferenceError";
    }
}