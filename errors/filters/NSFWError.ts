import GenericFilterError from "./GenericFilterError";

/* Called when NSFW filter fails */
export default class NSFWError extends GenericFilterError {
    constructor(m: string, whitelist: boolean) {
        super(m, whitelist);
        
        this.name = "NSFWError";
    }
}