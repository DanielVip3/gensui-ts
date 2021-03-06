import IORedis from 'ioredis';

export interface CooldownStoreObject {
    called: Date,
    times: number,
}

interface CooldownStoreOptions {
    cooldownTime?: number,
    maxTimes?: number,
}

interface RedisCooldownStoreOptions extends CooldownStoreOptions {
    cooldownIdentifierKey: string,
    cooldownHashKey?: string,
    store: IORedis.Redis,
}

export abstract class CooldownStore {
    public id: number = Math.random();
    protected abstract store;
    public readonly abstract cooldownTime: number = 60 * 60 * 1000;
    protected abstract maxTimes: number = 1;

    constructor(options?: CooldownStoreOptions) {}

    abstract getCooldown(userId?: string): CooldownStoreObject|null|undefined|Promise<CooldownStoreObject|null>|Promise<CooldownStoreObject|null|undefined>;
    abstract isInCooldown(userId?: string): boolean|Promise<boolean>;
    abstract increaseCooldown(userId?: string): void|Promise<void>;
    abstract deleteCooldown(userId?: string): boolean|Promise<boolean>;
}

export class MemoryCooldownStore extends CooldownStore {
    protected store: {};
    public readonly cooldownTime: number = 60 * 60 * 1000;
    protected maxTimes: number = 1;
    
    constructor(options: CooldownStoreOptions = {}) {
        super(options);

        this.store = {};

        if (options.cooldownTime) this.cooldownTime = options.cooldownTime;
        if (options.maxTimes) this.maxTimes = options.maxTimes;
    }

    getCooldown(userId: string): CooldownStoreObject|null {
        if (!userId) return null;
        else return this.store[userId] as CooldownStoreObject;
    }

    isInCooldown(userId: string): boolean {
        if (!userId) return false;

        if (this.store[userId]) {
            if (this.store[userId].times >= this.maxTimes) {
                if ((new Date(this.store[userId].called.getTime() + this.cooldownTime)) <= new Date()) {
                    /* istanbul ignore else impossible to reach except in cases where the cooldown delete fails (and it can't happen except if you volountarily edit the store property, which shouldn't be done) */
                    if (this.deleteCooldown(userId)) return false;
                    else return true;
                } else return true;
            } else return false;
        } else return false;
    }

    increaseCooldown(userId: string, called?: Date): void {
        /* istanbul ignore if */
        if (!userId) return;
        if (!called) called = new Date();

        if (!this.store[userId]) this.store[userId] = ({ called, times: 1 } as CooldownStoreObject);
        else {
            if (this.store[userId].times >= this.maxTimes || new Date(this.store[userId].called.getTime() + this.cooldownTime) <= called) {
                this.store[userId].called = called;
                this.store[userId].times = 1;
            } else {
                this.store[userId].times += 1;
            }
        }
    }

    deleteCooldown(userId: string): boolean {
        if (!userId) return false;

        if (this.store[userId]) {
            delete this.store[userId];
            return true;
        }
        else return false;
    }

    clear(): boolean {
        this.store = {};

        return true;
    }
}

export class RedisCooldownStore extends CooldownStore {
    protected store: IORedis.Redis;
    public readonly cooldownTime: number = 60 * 60 * 1000;
    protected cooldownHashKey: string = "bot.commands.cooldown";
    protected maxTimes: number = 1;

    constructor(options: RedisCooldownStoreOptions) {
        super(options);

        if (!options) throw "RedisCooldownStore needs an options object with configuration parameters.";

        /* We check if the options store contains the "connect" method to be sure it's a RedisCooldownStore. */
        if (!options.store || !options.store.connect) throw "RedisCooldownStore needs an IORedis Client in the options field `store`.";
        else this.store = options.store;

        if (options.cooldownTime) this.cooldownTime = options.cooldownTime;
        if (options.cooldownHashKey) this.cooldownHashKey = options.cooldownHashKey;
        if (options.maxTimes) this.maxTimes = options.maxTimes;

        if (options.cooldownIdentifierKey) {
            this.cooldownHashKey += `.${options.cooldownIdentifierKey}`;
        } else throw "RedisCooldownStore needs a `cooldownIdentifierKey` field to specify a key which identifies the cooldown's command in the redis store.";
    }

    protected composeUserKey(userId: string): string {
        return `${this.cooldownHashKey}.${userId}`;
    }

    async getCooldown(userId: string): Promise<CooldownStoreObject|undefined|null> {
        if (!userId) return null;

        const cooldownUserString: string|null = await this.store.get(this.composeUserKey(userId));
        let cooldownUserObject: CooldownStoreObject|undefined = undefined;
        if (cooldownUserString) cooldownUserObject = JSON.parse(cooldownUserString) as CooldownStoreObject /* istanbul ignore next */ || undefined;

        return cooldownUserObject;
    }

    async isInCooldown(userId: string): Promise<boolean> {
        if (!userId) return false;

        const cooldownUserObject: CooldownStoreObject|null|undefined = await this.getCooldown(userId);

        if (cooldownUserObject) {
            if (cooldownUserObject.times >= this.maxTimes) {
                if (new Date(new Date(cooldownUserObject.called).getTime() + this.cooldownTime) <= new Date()) {
                    /* istanbul ignore else: impossible to reach except in cases where the cooldown delete fails (and it can't happen except if you volountarily edit the store property, which shouldn't be done) */
                    if (this.deleteCooldown(userId)) return false;
                    else return true;
                } else return true;
            } else return false;
        } else return false;
    }

    async increaseCooldown(userId: string, called?: Date): Promise<void> {
        /* istanbul ignore if: it doesn't make sense to test because this method doesn't return nothing in any case so you can't know if this if returned or not without doing anything */
        if (!userId) return;
        if (!called) called = new Date();

        const cooldownUserObject: CooldownStoreObject|null|undefined = await this.getCooldown(userId);

        if (!cooldownUserObject) {
            this.store.set(this.composeUserKey(userId), JSON.stringify({ called, times: 1 } as CooldownStoreObject));
            this.store.pexpire(this.composeUserKey(userId), this.cooldownTime);
        } else {
            if (cooldownUserObject.times >= this.maxTimes || new Date(new Date(cooldownUserObject.called).getTime() + this.cooldownTime) <= called) {
                this.store.set(this.composeUserKey(userId), JSON.stringify({ called, times: 1 } as CooldownStoreObject));
                this.store.pexpire(this.composeUserKey(userId), this.cooldownTime);
            } else {
                cooldownUserObject.times++;
                this.store.set(this.composeUserKey(userId), JSON.stringify(cooldownUserObject));
            }
        }
    }

    async deleteCooldown(userId: string): Promise<boolean> {
        if (!userId) return false;

        return !!await this.store.unlink(this.composeUserKey(userId));
    }

    async clear() {
        this.store.keys(`${this.cooldownHashKey}*`).then((keys) => {
            const pipeline: IORedis.Pipeline = this.store.pipeline();
            keys.forEach(async function (key) {
                pipeline.unlink(key);
            });

            return pipeline.exec();
        });
    }
}

export default {
    MemoryCooldownStore,
    RedisCooldownStore
};