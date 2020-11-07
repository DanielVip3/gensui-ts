import GenericInterceptorError from './GenericInterceptorError';

/* Called when user is in cooldown */
export default class CommandCooldownError extends GenericInterceptorError {
    remaining: number;

    constructor(m: string, started?: Date, cooldownTime?: number) {
        super(m);
        
        this.name = "CommandCooldownError";
        if (started && cooldownTime) {
            this.remaining = new Date().getTime() - new Date(started.getTime() + cooldownTime).getTime();
        }
    }
}