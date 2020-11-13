import './config/yup-locale';
import Bot from './classes/Bot';

import { Filters } from './filters/Filters';
import { Interceptors } from './interceptors/Interceptors';
import { Consumers } from './consumers/Consumers';
import { CooldownError } from './errors';
import { CommandContext, CommandIdentifier } from './classes/commands/Command';
import { MemoryCooldownStore } from './classes/utils/CooldownStores';
import { EventContext } from './classes/events/EventContext';

const bot: Bot = new Bot({
    name: "Genshiro Bot",
    token: "NzcyNDg2NjE5ODkzNTk2MTcx.X57YOg.QqPsSuoblV__rY-sbXP7YkaFdwE",
    prefix: "!"
}, () => {
    console.log("Bot startato!");
});

/* TODO:
    Testing delle novità

    altri filters, interceptors e consumers

    Interceptors per eventi (solo custom, niente di pre-esistente)
    Consumers per eventi (solo custom, niente di pre-esistente)

    Injectables
        DB e DB injection nelle classi
        Cache e cache injection nelle classi

    Sandbox

    Safe runtime
    ^ questo decoratore, se aggiunto ad un metodo, lo esegue ogni volta in un child_process.fork e gli rende impossibile accedere a qualunque cosa del programma se non esplicitamente importata nel metodo

    Expectations
    ^ sistema di testing dei comandi e delle loro funzioni integrato nel framework (?)

    Custom events
    ^ wrappers di eventi più complicati uniti assieme (es. guildMemberUpdate) per definire eventi unici più semplici (es. il cambio di canale vocale, proveniente da un guildMemberUpdate)

    Sistema per conservare variabili critiche es. id dei ruoli, id dei canali, id dei servers etc.

    Sistema di internazionalizzazione per-server o per-utente (I18N) per le descrizioni dei comandi e gli errori

    Multiprefix
*/

class Commands {
    @bot.Scope(1) id: CommandIdentifier;

    @bot.Filter(Filters._NSFW)
    @bot.Interceptor(Interceptors.Cooldown(new MemoryCooldownStore()))
    @bot.Consumer(Consumers._Log)
    @bot.Metadata({ showHelp: false })
    @bot.Command()
    testf({ command, message, data }: CommandContext): void {
    }

    @bot.Event()
    guildMemberUpdate(update: EventContext): void {
        console.log(update);
    }
}

bot.start();