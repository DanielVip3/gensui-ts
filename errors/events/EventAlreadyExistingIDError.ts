import { EventIdentifier } from "../../classes/events/Event";

/* Called when an event already exists with the same identical id */
export default class EventAlreadyExistingIDError extends Error {
    id: EventIdentifier;

    constructor(m: string, id?: EventIdentifier) {
        super(m);
        
        this.name = "EventAlreadyExistingIDError";
        if (id) this.id = id;
    }
}