export const noop = () => {};
export const timeoutError = new Error('Task timed out');
export const taskTimeoutValueError = new Error('taskTimeout value cannot be less than 0');

const getTurn = () => {
  const indirectResolver = (resolve: () => void) => () => resolve();
  let releaser: () => void = noop;
  const promise = new Promise((resolve) => releaser = indirectResolver(resolve));
  return {
    releaser,
    promise,
  };
}

const syncQueue = <T>(taskTimeout: number = 0) => {
  const queue: Array<() => void> = [];
  let running = false;
  let timeoutId: NodeJS.Timeout | null = null;
  if (taskTimeout < 0) { throw taskTimeoutValueError; }

  const dispatchNextTask = () => {
    if (!running) {
      const release = queue.shift();
      if (release) {
        running = true;
        release();
      }
    }
  };

  const run = async (task: () => T): Promise<T> => {
    const turn = getTurn();
    queue.push(turn.releaser);
    dispatchNextTask();
    await turn.promise;
    try {
      const timeout: Promise<T> = new Promise((resolve, reject) => {
        if (taskTimeout > 0) {
          timeoutId = setTimeout(() => reject(timeoutError), taskTimeout);
        }
      });
      const result = await Promise.race([task(), timeout]);;
      return result;
    } finally {
      running = false;
      if (timeoutId !== null) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      dispatchNextTask();
    }
  };

  return {
    run,
  };
};

export default syncQueue;
