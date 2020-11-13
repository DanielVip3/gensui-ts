export default class BotEvents {
    protected events: Event[] = [];

    constructor(startingEvents?: Event|Event[]) {
        if (startingEvents) {
            if (Array.isArray(startingEvents)) this.events = this.events.concat(startingEvents);
            else this.events.push(startingEvents);
        }
    }

    addEvent(event: Event): Event {
        this.events.push(event);

        return event;
    }

    removeCommand(eventId: EventIdentifier): Event {
        const eventIndex: number = this.events.findIndex(e => e.id === eventId);
        const event: Event = this.events[eventIndex];

        this.events.splice(eventIndex, 1);

        return event;
    }

    getCommand(eventId: EventIdentifier): Event|undefined {
        return this.events.find(c => c.id === eventId);
    }

    getAllCommands(): Event[] {
        return this.events;
    }
};