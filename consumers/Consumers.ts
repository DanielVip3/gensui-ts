import LogConsumer from './LogConsumer';
import { default as InlineConsumer, InlineConsumerCallback } from './InlineConsumer';

export * as LogConsumer from './LogConsumer';
export * as InlineConsumer from './InlineConsumer';

export class Consumers {
    public static get _Log(): LogConsumer {
        return new LogConsumer();
    }

    public static Log(customText?: string, customLogFunction?: Function): LogConsumer {
        return new LogConsumer(customText, customLogFunction);
    }

    public static Inline(callback: InlineConsumerCallback) {
        return new InlineConsumer(callback);
    }   
}

export default Consumers;