import type { Log } from "./Log.js";
import { LogLevel } from "./LogLevel.js";
import { AsyncStream } from "./utility/AsyncStream.js";

function logWithoutMetadata(logger: Logger, message: unknown, tag: string | null, level: LogLevel, secure = false) {
  let resolvedTag = tag ?? "Unknown";
  const metadata: Record<string, any> = {};

  const stack = new Error().stack?.split("\n") ?? [];
  const trace = stack[4];
  if (trace && trace.includes("at ")) {
    metadata["trace"] = trace.trim();
    if (!tag) {
      const match = trace.split("at ")[1]!.split(" ")[0]!;
      if (match) {
        resolvedTag = match.split(".")[0] ?? resolvedTag;
      }
    }
  }

  logger.logMetadata(message, resolvedTag, level, secure, metadata);
}

export class Logger {
  private mainStream: AsyncStream<Log>;
  private continuation!: AsyncStream.Continuation<Log>;

  constructor() {
    this.mainStream = new AsyncStream<Log>((cont) => {
      this.continuation = cont;
    });
  }

  stream(tag?: string, level: LogLevel = LogLevel.DEBUG): AsyncIterable<Log> {
    const self = this;
    async function* filtered() {
      for await (const log of self.mainStream) {
        const tagMatches = tag ? log.tag === tag : true;
        const levelMatches = log.level <= level;
        if (tagMatches && levelMatches) {
          yield log;
        }
      }
    }
    return filtered();
  }

  tagged(tag: string): Logger.Tagged {
    return new Logger.Tagged(this, tag);
  }

  logMetadata(message: unknown, tag: string, level: LogLevel, secure = false, metadata: Record<string, any> = {}) {
    this.continuation.push({
      date: new Date(),
      tag,
      message: String(message),
      level,
      secure,
      metadata,
    });
  }
  log(message: unknown, tag?: string, level: LogLevel = LogLevel.INFO, secure: boolean = false) {
    logWithoutMetadata(this, message, tag ?? null, level, secure);
  }
  fault(message: unknown, tag?: string, secure = false) {
    this.log(message, tag, LogLevel.FAULT, secure);
  }
  error(message: unknown, tag?: string, secure = false) {
    this.log(message, tag, LogLevel.ERROR, secure);
  }
  info(message: unknown, tag?: string, secure = false) {
    this.log(message, tag, LogLevel.INFO, secure);
  }
  debug(message: unknown, tag?: string, secure = false) {
    this.log(message, tag, LogLevel.DEBUG, secure);
  }

  static shared = new Logger();

  static flow(tag?: string, level: LogLevel = LogLevel.DEBUG) {
    return Logger.shared.stream(tag, level);
  }
  static logMetadata(message: any, tag: string, level: LogLevel, secure = false, metadata: Record<string, any> = {}) {
    Logger.shared.logMetadata(message, tag, level, secure, metadata);
  }
  static log(message: any, tag?: string, level: LogLevel = LogLevel.INFO, secure = false) {
    logWithoutMetadata(Logger.shared, message, tag ?? null, level, secure);
  }
  static fault(message: any, tag?: string, secure = false) {
    this.log(message, tag, LogLevel.FAULT, secure);
  }
  static error(message: any, tag?: string, secure = false) {
    this.log(message, tag, LogLevel.ERROR, secure);
  }
  static info(message: any, tag?: string, secure = false) {
    this.log(message, tag, LogLevel.INFO, secure);
  }
  static debug(message: any, tag?: string, secure = false) {
    this.log(message, tag, LogLevel.DEBUG, secure);
  }
}

export namespace Logger {
  export class Tagged {
    constructor(private readonly logger: Logger, readonly tag: string) {}

    logMetadata(message: any, level: LogLevel, secure = false, metadata: Record<string, any> = {}) {
      this.logger.logMetadata(message, this.tag, level, secure, metadata);
    }

    log(message: any, level: LogLevel, secure = false) {
      logWithoutMetadata(this.logger, message, this.tag, level, secure);
    }
    fault(message: any, secure = false) {
      this.log(message, LogLevel.FAULT, secure);
    }
    error(message: any, secure = false) {
      this.log(message, LogLevel.ERROR, secure);
    }
    info(message: any, secure = false) {
      this.log(message, LogLevel.INFO, secure);
    }
    debug(message: any, secure = false) {
      this.log(message, LogLevel.DEBUG, secure);
    }
  }
}
