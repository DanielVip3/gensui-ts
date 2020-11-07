import { CommandIdentifier } from '../../classes/Command';

/* Called when a command is instantiated and it doesn't have at least a name */
export default class CommandNoNameError extends Error {
    id?: CommandIdentifier;

    constructor(m: string, id?: CommandIdentifier) {
        super(m);
        
        this.name = "CommandNoNameError";
        if (id) this.id = id;
    }
}