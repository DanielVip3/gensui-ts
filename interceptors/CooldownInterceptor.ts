import { CommandContext } from "../classes/Command";
import { CooldownStore, CooldownStoreObject } from "../classes/CommandCooldownStores";
import { CommandInterceptor, CommandInterceptorResponse } from "../classes/CommandInterceptor";
import { CommandCooldownError } from "../errors";

export default class CooldownInterceptor implements CommandInterceptor {
    store: CooldownStore;

    constructor(store: CooldownStore) {
        this.store = store;
    }

    async intercept({ command, message, data }: CommandContext): Promise<CommandInterceptorResponse> {
        if (!message || !message.author || !message.author.id) return { next: true };

        command.metadata.cooldownStore = this.store;

        if (await this.store.isInCooldown(message.author.id)) {
            const cooldown: CooldownStoreObject|null = await this.store.getCooldown(message.author.id);
            if (cooldown) throw new CommandCooldownError("Command is in cooldown.", cooldown.called, this.store.cooldownTime);
            else throw new CommandCooldownError("Command is in cooldown.");
        } else {
            this.store.increaseCooldown(message.author.id);

            const cooldown: CooldownStoreObject|null = await this.store.getCooldown(message.author.id);

            return {
                next: true,
                data: {
                    cooldown: {
                        store: this.store,
                        cooldown: cooldown
                    }
                },
            };
        }
    }
}