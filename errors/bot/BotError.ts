/* Called when an error happens when instantiating a bot */
export default class BotError extends Error {
    constructor(m: string) {
        super(m);
        
        this.name = "BotError";
    }
}