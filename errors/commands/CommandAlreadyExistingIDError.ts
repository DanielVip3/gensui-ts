/* Called when a command already exists with the same identical id */
export default class CommandAlreadyExistingIDError extends Error {
    constructor(m: string) {
        super(m);
        
        this.name = "CommandAlreadyExistingIDError";
    }
}