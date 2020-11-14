import { Client } from "discord.js";
import Bot from "../Bot";

export type Sandbox = (client?: Client, bot?: Bot) => any;