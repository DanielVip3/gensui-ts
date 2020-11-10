import { CooldownStore } from "../classes/utils/CooldownStores";

import CooldownInterceptor from "./CooldownInterceptor";
import { default as InlineInterceptor, InlineInterceptorCallback } from './InlineInterceptor';

export * as CooldownInterceptor from './CooldownInterceptor';

export class Interceptors {
    public static Cooldown(store: CooldownStore): CooldownInterceptor {
        return new CooldownInterceptor(store);
    }
    
    public static Inline(callback: InlineInterceptorCallback) {
        return new InlineInterceptor(callback);
    }
}

export default Interceptors;