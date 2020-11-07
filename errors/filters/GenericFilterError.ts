/* Base class which groups all filter errors */
export default class GenericFilterError extends Error {
    public whitelist: boolean = true;

    constructor(m: string, whitelist: boolean) {
        super(m);

        if (whitelist !== undefined) this.whitelist = whitelist;
    }
}