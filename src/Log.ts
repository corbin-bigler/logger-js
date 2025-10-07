import type { LogLevel } from "./LogLevel.js"

export type Log = {
  date: Date,
  tag: string,
  message: string,
  level: LogLevel,
  secure: boolean,
  metadata: Record<string, any>
}