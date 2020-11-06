/* Called when NSFW filter fails */
export default class TextChannelsError extends Error {
    channels: string[]|string = [];
    whitelist: boolean = true;

    constructor(m: string, channels: string[]|string, whitelist: boolean) {
        super(m);
        
        this.name = "TextChannelsError";
        if (channels) this.channels = channels;
        if (whitelist !== undefined) this.whitelist = whitelist;
    }
}