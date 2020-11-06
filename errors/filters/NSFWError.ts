/* Called when NSFW filter fails */
export default class NSFWError extends Error {
    whitelist: boolean = true;

    constructor(m: string, whitelist: boolean) {
        super(m);
        
        this.name = "NSFWError";
        if (whitelist !== undefined) this.whitelist = whitelist;
    }
}