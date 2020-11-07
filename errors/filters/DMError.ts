import GenericFilterError from "./GenericFilterError";

/* Called when DM filter fails */
export default class DMError extends GenericFilterError {
    constructor(m: string, whitelist: boolean) {
        super(m, whitelist);
        
        this.name = "DMError";
    }
}