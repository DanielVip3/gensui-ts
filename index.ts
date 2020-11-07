import './config/yup-locale';
import Bot from './classes/Bot';

import { Filters } from './filters/Filters';
import { NSFWError } from './errors';
import { CommandContext, CommandIdentifier } from './classes/Command';

const bot: Bot = new Bot({
    name: "Genshiro Bot",
    token: "NzcyNDg2NjE5ODkzNTk2MTcx.X57YOg.QqPsSuoblV__rY-sbXP7YkaFdwE",
    prefix: "!"
}, () => {
    console.log("Bot startato!");
});

/* TODO:
    descrizioni ai comandi

    altri filters
    InlineFilter async

    Interceptors
        Rendere cooldown un interceptor
        Exception per cooldown

    Consumers
    ^ i consumers sono le funzioni eseguite DOPO il comando che ricevono il return del comando e ne operano di conseguenza, es. settano qualcosa nel db etc.

    Transformers
    ^ i transformers sono funzioni che prendono i dati originali del comando/evento e li trasformano

    Eventi
        Interceptors per eventi (solo custom, niente di pre-esistente)
        Transformers per eventi (solo custom, niente di pre-esistente)

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

    Sistema per organizzare i comandi etc. in cartelle e realizzare poi un help o compendio totale

    Sistema di internazionalizzazione per-server o per-utente (I18N) per le descrizioni dei comandi e gli errori

    Multiprefix
*/

class Commands {
    @bot.Scope(1) id: CommandIdentifier;

    @bot.Command({
        filters: [Filters._NSFW]
    })
    testf({ command, message }: CommandContext): void {
        console.log(message.content);
    }

    @bot.Except({
        exceptions: [NSFWError]
    })
    testErrorHandler(): void {
        console.log("test ERRORE");
    }
}

bot.start();