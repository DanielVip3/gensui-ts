/*
* This function handles matching of thrown errors and accepted error kinds for exception handlers of commands and events.
* It basically accepts the thrown exception and one accepted error and compares them to see if it's valid and should be handled - and returns a boolean.
* 
* exception is the thrown exception; it can be an instance of an error or the class/constructor of an error;
* error is the accept error kind for comparison; it can be an instance of an error, the class/constructor of an error or a string which matches the eventual message.
*/
export default function exceptionShouldBeHandled(exception, error): boolean {
    function standardPrototypeCheck(): boolean { // a standard prototype check which handles all possible mainstream cases
        if (exception.prototype === undefined && error.prototype === undefined) return Object.getPrototypeOf(exception) === Object.getPrototypeOf(error);
        if (Object.getPrototypeOf(exception) === undefined && Object.getPrototypeOf(error) === undefined) return exception.prototype === error.prototype;

        return exception.prototype === error.prototype
            || Object.getPrototypeOf(exception) === error.prototype
            || exception.prototype === Object.getPrototypeOf(error)
            || Object.getPrototypeOf(exception) === Object.getPrototypeOf(error);
    }

    if (!exception || !error) return false;
    if (typeof exception !== "object" && typeof exception !== "function") return false;

    let errorComparisonValue = error;

    if (typeof error === "string" && exception.message) { // the accepted error is an error message which should match
        /* istanbul ignore next */ if (Array.isArray(exception.message) && exception.message.length >= 1) return exception.message.some(m => m.includes(error));
        else if (typeof exception.message === "string") return exception.message.includes(error);
        else return standardPrototypeCheck();
    } else if (typeof error === "object") { // maybe the accepted error is specified as an instance of a class
        errorComparisonValue = Object.getPrototypeOf(error);
    } else if (typeof error === "function") { // the accepted error is probably specified as a constructor
        errorComparisonValue = error.prototype || error;
    } else return standardPrototypeCheck();

    /* Here, we should handle both cases like for "error"; "exception" can be both an instantance of the error or the constructor/class of it. */
    if (typeof exception === "object") {
        return errorComparisonValue === Object.getPrototypeOf(exception);
    } else if (typeof exception === "function") {
        return errorComparisonValue === exception.prototype;
    } else return standardPrototypeCheck();
}