import { EventIdentifier } from "../../classes/events/Event";

/* Called when a command already exists with the same identical id */
export default class CommandAlreadyExistingIDError extends Error {
    id: EventIdentifier;

    constructor(m: string, id?: EventIdentifier) {
        super(m);
        
        this.name = "CommandAlreadyExistingIDError";
        if (id) this.id = id;
    }
}