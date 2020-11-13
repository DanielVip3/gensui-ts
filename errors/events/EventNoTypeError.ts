/* Called when an event is instantiated and it doesn't have at least a type */
export default class EventNoTypeError extends Error {
    constructor(m: string) {
        super(m);
        
        this.name = "EventNoTypeError";
    }
}