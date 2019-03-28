import "jest";
import syncQueue, { timeoutError, taskTimeoutValueError } from "index";

const wait = (time: number) => new Promise((resolve) => setTimeout(resolve, time));

const range = (start: number, to: number) => {
  const result: number[] = [];
  for (let i = start; i < to; i++) {
    result.push(i);
  }
  return result;
};

describe('syncQueue', () => {
  test('followsExpectedSequence', async () => {
    const sequence: number[] = [];
    const expectedSequence: number[] = range(0, 9);
    const q = syncQueue(50);
    const collection = [
      q.run(async (): Promise<number> => {
        for (let i = 0; i < 3; i ++) {
          await wait(5);
          sequence.push(i);
        }
        return 10;
      }),
      q.run(async () => {
        for (let i = 3; i < 6; i ++) {
          await wait(1);
          sequence.push(i);
        }
        return 20;
      }),
      q.run(async () => {
        for (let i = 6; i < 9; i ++) {
          await wait(1);
          sequence.push(i);
        }
        return 30;
      }),
    ];
    const result = await Promise.all(collection);

    expect(sequence).toEqual(expectedSequence);
    expect(result).toEqual([10, 20, 30]);
  });

  test("different queues do not block each other's handlers", async () => {
    const waitTime = 10;
    const parallelJobs = 4;
    const queues = range(0, parallelJobs).map((n) => syncQueue());

    const timeBeforeStarting = new Date();
    const promises = queues.map((q) =>
      q.run(async () => {
        await wait(waitTime);
      })
    );

    await Promise.all(promises);
    const timeAfterFinishing = new Date();
    const delta = timeAfterFinishing.getTime() - timeBeforeStarting.getTime();

    expect(delta).toBeLessThan(waitTime * parallelJobs);
  });

  test('task times out waiting for lock to be released', async () => {
    const q = syncQueue(5);

    const subject = async () => {
      await q.run(async () => {
        await wait(100);
        return 1;
      })
    };
    await expect(subject()).rejects.toEqual(timeoutError);
  });

  test('taskTimeout must be greater than or equal to 0', () => {
    expect(() => syncQueue(-1)).toThrow(taskTimeoutValueError);
    expect(() => syncQueue(-10)).toThrow(taskTimeoutValueError);
  });
});
