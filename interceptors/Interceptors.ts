import { CooldownStore } from "../classes/CommandCooldownStores";

import CooldownInterceptor from "./CooldownInterceptor";

export * as CooldownInterceptor from './CooldownInterceptor';

export class Interceptors {
    public static CooldownInterceptor(store: CooldownStore): CooldownInterceptor {
        return new CooldownInterceptor(store);
    }
}

export default Interceptors;