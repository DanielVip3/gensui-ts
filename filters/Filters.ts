import { ClientEvents } from "discord.js";

import DMFilter from "./commands/NSFWFilter";
import GuildsFilter from './commands/GuildsFilter';
import { default as InlineCommandFilter, InlineFilterCallback as InlineCommandFilterCallback } from './commands/InlineFilter';
import { default as InlineEventFilter, InlineFilterCallback as InlineEventFilterCallback } from './events/InlineFilter';
import NSFWFilter from "./commands/NSFWFilter";
import TextChannelsFilter from "./commands/TextChannelsFilter";

export * as DMFilter from './commands/DMFilter';
export * as GuildsFilter from './commands/GuildsFilter';
export { default as InlineCommandFilter, InlineFilterCallback as InlineCommandFilterCallback } from './commands/InlineFilter';
export { default as InlineEventFilter, InlineFilterCallback as InlineEventFilterCallback } from './events/InlineFilter';
export * as NSFWFilter from "./commands/NSFWFilter";
export * as TextChannelsFilter from './commands/TextChannelsFilter';

export namespace Filters {
    export class Commands {
        public static get _DM(): DMFilter {
            return new DMFilter(true);
        }
    
        public static get _NSFW(): NSFWFilter {
            return new NSFWFilter(true);
        }
    
        public static Inline(callback: InlineCommandFilterCallback, whitelist: boolean = true) {
            return new InlineCommandFilter(callback, whitelist);
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

    export class Events {
        public static Inline<K extends keyof ClientEvents>(callback: InlineEventFilterCallback<K>, whitelist: boolean = true) {
            return new InlineEventFilter(callback, whitelist);
        }
    }
}

export default Filters;