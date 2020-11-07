import GenericFilterError from "./GenericFilterError";

/* Called when NSFW filter fails */
export default class TextChannelsError extends GenericFilterError {
    channels: string[]|string = [];

    constructor(m: string, channels: string[]|string, whitelist: boolean) {
        super(m, whitelist);
        
        this.name = "TextChannelsError";
        if (channels) this.channels = channels;
    }
}