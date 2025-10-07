export class AsyncStream<T> implements AsyncIterable<T> {
  private queue: T[] = [];
  private resolvers: ((result: IteratorResult<T>) => void)[] = [];
  private ended = false;

  constructor(builder: (continuation: AsyncStream.Continuation<T>) => void) {
    const continuation: AsyncStream.Continuation<T> = {
      push: this.push.bind(this),
      end: this.end.bind(this),
    };
    builder(continuation);
  }

  private push(value: T) {
    if (this.ended) return;
    if (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve({ value, done: false });
    } else {
      this.queue.push(value);
    }
  }

  private end() {
    if (this.ended) return;
    this.ended = true;
    while (this.resolvers.length > 0) {
      const resolve = this.resolvers.shift()!;
      resolve({ value: undefined as any, done: true });
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T> {
    return {
      next: (): Promise<IteratorResult<T>> => {
        if (this.queue.length > 0) {
          const value = this.queue.shift()!;
          return Promise.resolve({ value, done: false });
        }
        if (this.ended) {
          return Promise.resolve({ value: undefined as any, done: true });
        }
        return new Promise((resolve) => this.resolvers.push(resolve));
      },
    };
  }
}

export namespace AsyncStream {
  export type Continuation<T> = {
    push: (value: T) => void;
    end: () => void;
  };
}