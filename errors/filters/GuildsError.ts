/* Called when guilds filter fails */
export default class GuildsError extends Error {
    guilds: string[]|string = [];
    whitelist: boolean = true;

    constructor(m: string, guilds: string[]|string, whitelist: boolean) {
        super(m);
        
        this.name = "GuildsError";
        if (guilds) this.guilds = guilds;
        if (whitelist !== undefined) this.whitelist = whitelist;
    }
}