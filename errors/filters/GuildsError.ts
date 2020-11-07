import GenericFilterError from "./GenericFilterError";

/* Called when guilds filter fails */
export default class GuildsError extends GenericFilterError {
    guilds: string[]|string = [];

    constructor(m: string, guilds: string[]|string, whitelist: boolean) {
        super(m, whitelist);
        
        this.name = "GuildsError";
        if (guilds) this.guilds = guilds;
    }
}