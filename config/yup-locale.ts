import { setLocale } from 'yup';

setLocale({
    mixed: {
        required: '${path} is a required field.',
        notType: '${path} must be a ${type}.'
    },
});