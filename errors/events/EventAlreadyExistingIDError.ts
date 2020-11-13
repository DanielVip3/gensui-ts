/* Called when an event already exists with the same identical id */
export default class EventAlreadyExistingIDError extends Error {
    constructor(m: string) {
        super(m);
        
        this.name = "EventAlreadyExistingIDError";
    }
}