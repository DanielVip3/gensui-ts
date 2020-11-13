import { CooldownStore } from "../classes/utils/CooldownStores";

import CooldownInterceptor from "./commands/CooldownInterceptor";
import { default as InlineCommandInterceptor, InlineInterceptorCallback as InlineCommandInterceptorCallback } from './commands/InlineInterceptor';
import { default as InlineEventInterceptor, InlineInterceptorCallback as InlineEventInterceptorCallback } from './events/InlineInterceptor';

export * as CooldownInterceptor from './commands/CooldownInterceptor';

export namespace Interceptors {
    export class Commands {
        public static Cooldown(store: CooldownStore): CooldownInterceptor {
            return new CooldownInterceptor(store);
        }
        
        public static Inline(callback: InlineCommandInterceptorCallback) {
            return new InlineCommandInterceptor(callback);
        }
    }

    export class Events {
        public static Inline(callback: InlineEventInterceptorCallback) {
            return new InlineEventInterceptor(callback);
        }
    }
}

export default Interceptors;