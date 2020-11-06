/* Called when DM filter fails */
export default class DMError extends Error {
    whitelist: boolean = true;

    constructor(m: string, whitelist: boolean) {
        super(m);
        
        this.name = "DMError";
        if (whitelist !== undefined) this.whitelist = whitelist;
    }
}