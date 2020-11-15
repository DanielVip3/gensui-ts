import InlineValidator from './InlineValidator';

export * as InlineValidator from './InlineValidator';

export class Validators {
    public static Inline(test: string) {
        return new InlineValidator(test);
    }
}


export default Validators;