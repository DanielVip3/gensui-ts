import { ClientEvents } from "discord.js";

export type EventArgsOf<K extends keyof ClientEvents> = ClientEvents[K];