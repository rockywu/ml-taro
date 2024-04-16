import { IORetryAdapter } from '../src/IORetryAdapter';

// 模拟一个 IO 函数
async function mockIOFunction(...args: any[]): Promise<any[]> {
  // 模拟一个成功的 IO 请求
  return [...args];
}

// 测试 IORetryAdapter 类
describe('IORetryAdapter', () => {
  // 测试构造函数
  test('constructor should initialize properties correctly', () => {
    const ioRetryAdapter = new IORetryAdapter(mockIOFunction, 5, 2000);
    expect(ioRetryAdapter['ioFunction']).toBe(mockIOFunction);
    expect(ioRetryAdapter['maxRetries']).toBe(5);
    expect(ioRetryAdapter['retryInterval']).toBe(2000);
  });

  // 测试 executeWithRetry 方法
  test('executeWithRetry should retry and resolve with correct result', async () => {
    const ioRetryAdapter = new IORetryAdapter(mockIOFunction, 3, 100);
    const result = await ioRetryAdapter.executeWithRetry(...[0,1,2]);
    expect(result[0]).toBe(0);
    expect(result[1]).toBe(1);
    expect(result[2]).toBe(2);
  });

  // 测试 executeWithRetry 方法在达到最大重试次数后是否抛出异常
  test('executeWithRetry should throw error after max retries', async () => {
    const ioRetryAdapter = new IORetryAdapter(async () => {
      throw new Error('Mock error');
    }, 3, 100);
    await expect(ioRetryAdapter.executeWithRetry()).rejects.toThrow('Mock error');
  });
});
