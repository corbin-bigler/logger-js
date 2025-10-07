import { Logger } from "../src/Logger.js";
import { LogLevel } from "../src/LogLevel.js";

describe("Logger", () => {
  test("testNoTagNoLevel", async () => {
    const message = crypto.randomUUID();
    const stream = Logger.flow();

    const collector = (async () => {
      for await (const log of stream) {
        expect(log.message).toBe(message);
        break;
      }
    })();

    Logger.debug(message, crypto.randomUUID());

    await collector;
  });

  test("testTagLevel", async () => {
    const tag = crypto.randomUUID();
    const message = crypto.randomUUID();
    const stream = Logger.flow(tag, LogLevel.ERROR);

    let count = 0;
    const collector = (async () => {
      for await (const log of stream) {
        expect(log.message).toBe(message);
        expect(log.tag).toBe(tag);

        if (count === 0) {
          expect(log.level).toBe(LogLevel.ERROR);
        } else if (count === 1) {
          expect(log.level).toBe(LogLevel.FAULT);
          break;
        }
        count++;
      }
    })();

    Logger.debug(message, tag);
    Logger.info(message, tag);
    Logger.error(message, tag);
    Logger.error(message, crypto.randomUUID());
    Logger.fault(message, tag);

    await collector;
  });
});
