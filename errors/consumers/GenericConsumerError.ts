/* Base class which groups all consumer errors */
export default class GenericConsumerError extends Error {
    constructor(m: string) {
        super(m);
    }
}