import LogConsumer from './commands/LogConsumer';
import { default as InlineCommandConsumer, InlineCommandConsumerCallback } from './commands/InlineConsumer';
import { default as InlineEventConsumer, InlineEventConsumerCallback } from './events/InlineConsumer';

export { default as LogConsumer } from './commands/LogConsumer';
export { default as InlineCommandConsumer, InlineCommandConsumerCallback } from './commands/InlineConsumer';
export { default as InlineEventConsumer, InlineEventConsumerCallback } from './events/InlineConsumer';

export namespace Consumers {
    export class Commands {
        public static get _Log(): LogConsumer {
            return new LogConsumer();
        }
    
        public static Log(customText?: string, customLogFunction?: Function): LogConsumer {
            return new LogConsumer(customText, customLogFunction);
        }
    
        public static Inline(callback: InlineCommandConsumerCallback) {
            return new InlineCommandConsumer(callback);
        }
    }

    export class Events {
        public static Inline(callback: InlineEventConsumerCallback) {
            return new InlineEventConsumer(callback);
        }
    }
}


export default Consumers;