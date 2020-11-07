/* Base class which groups all interceptor errors */
export default class GenericInterceptorError extends Error {
    constructor(m: string) {
        super(m);
    }
}