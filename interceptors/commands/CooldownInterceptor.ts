import { CommandContext } from "../../classes/commands/Command";
import { CooldownStore, CooldownStoreObject } from "../../classes/utils/CooldownStores";
import { CommandInterceptor, CommandInterceptorResponse } from "../../classes/commands/CommandInterceptor";
import { CooldownError } from "../../errors";

export default class CooldownInterceptor extends CommandInterceptor {
    store: CooldownStore;

    constructor(store: CooldownStore) {
        super();

        this.store = store;
    }

    async intercept({ command, message, data }: CommandContext): Promise<CommandInterceptorResponse> {
        if (!message || !message.author || !message.author.id) return { next: true };

        command.metadata.cooldownStore = this.store;

        if (await this.store.isInCooldown(message.author.id)) {
            const cooldown: CooldownStoreObject|null|undefined = await this.store.getCooldown(message.author.id);
            /* istanbul ignore else */
            if (cooldown) throw new CooldownError("Command is in cooldown.", cooldown.called, this.store.cooldownTime);
            else throw new CooldownError("Command is in cooldown.");
        } else {
            this.store.increaseCooldown(message.author.id);

            const cooldown: CooldownStoreObject|null|undefined = await this.store.getCooldown(message.author.id);

            return {
                next: true,
                data: {
                    cooldown: {
                        store: this.store,
                        info: cooldown
                    }
                },
            };
        }
    }
}