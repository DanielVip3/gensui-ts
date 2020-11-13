/* Called when an event is instantiated and it doesn't have an id */
export default class EventNoIDError extends Error {
    constructor(m: string) {
        super(m);
        
        this.name = "EventNoIDError";
    }
}