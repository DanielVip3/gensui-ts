import LogConsumer from './commands/LogConsumer';
import { default as InlineCommandConsumer, InlineConsumerCallback as InlineCommandConsumerCallback } from './commands/InlineConsumer';
import { default as InlineEventConsumer, InlineConsumerCallback as InlineEventConsumerCallback } from './events/InlineConsumer';

export * as LogConsumer from './commands/LogConsumer';
export * as InlineConsumer from './commands/InlineConsumer';

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