import DMFilter from "./NSFWFilter";
import GuildsFilter from './GuildsFilter';
import { default as InlineFilter, InlineFilterCallback } from './InlineFilter';
import NSFWFilter from "./NSFWFilter";
import TextChannelsFilter from "./TextChannelsFilter";

export * as DMFilter from './DMFilter';
export * as GuildsFilter from './GuildsFilter';
export * as InlineFilter from './InlineFilter';
export * as NSFWFilter from "./NSFWFilter";
export * as TextChannelsFilter from './TextChannelsFilter';

export class Filters {
    public static get _DM(): DMFilter {
        return new DMFilter(true);
    }

    public static get _NSFW(): NSFWFilter {
        return new NSFWFilter(true);
    }

    public static Inline(callback: InlineFilterCallback, whitelist: boolean = true) {
        return new InlineFilter(callback, whitelist);
    }

    public static DM(whitelist: boolean = true): DMFilter {
        return new DMFilter(whitelist);
    }

    public static Guilds(guilds: string|string[], whitelist: boolean = true): GuildsFilter {
        return new GuildsFilter(guilds, whitelist);
    }

    public static NSFW(whitelist: boolean = true): NSFWFilter {
        return new NSFWFilter(whitelist);
    }

    public static TextChannels(channels: string|string[], whitelist: boolean = true): TextChannelsFilter {
        return new TextChannelsFilter(channels, whitelist);
    }
}

export default Filters;