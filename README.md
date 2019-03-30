# sync-queues

Utility for synchronizing async code.

## Usage

sync-queues has a very small surface API, you create synchronized queues and run tasks on it:

```typescript
import syncQueue from "sync-queues";

const wait = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

async function organizedSequence() {
  // In milliseconds, how long until a sync task is considered to time out.
  // 0 is considered a "no timeout" value and is the default one.
  const taskTimeout = 1000;
  const q = syncQueue(taskTimeout);
  const sequence: number[] = [];

  const a = q.run(async() => {
    for (let i = 0; i < 4; i ++) {
      await wait(100);
      sequence.push(i);
    }
    return 10;
  });

  const b = q.run(async() => {
    for (let i = 4; i < 8; i ++) {
      await wait(10);
      sequence.push(i);
    }
    return 20;
  });

  const result = [await a, await b];
  console.log(sequence);  // prints: [ 0, 1, 2, 3, 4, 5, 6, 7 ]
  return result;
}

async function start () {
  const s = await organizedSequence();
  console.log(s);  // prints: [ 10, 20 ]
}

start();
```
