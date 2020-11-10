import GenericConsumerError from './GenericConsumerError';

/* Called when logs couldn't have been send */
export default class LogError extends GenericConsumerError {
    constructor(m: string) {
        super(m);
        
        this.name = "LogError";
    }
}