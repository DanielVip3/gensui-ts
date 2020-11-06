/* Called when a command is instantiated and it doesn't have an id or at least a name */
export default class CommandNoIDError extends Error {
    constructor(m: string) {
        super(m);
        
        this.name = "CommandNoIDError";
    }
}