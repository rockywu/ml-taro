import { ICrossHander, IMessage, ReceiveFunction } from "./interface";
import EventEmitter from 'eventemitter3'

/**
 * 跨网页通讯
 * 本插件使用
 * BroadcastChannel 、 LocalStorage 和 SessionStorage 两类进行跨网页通讯
 */
const DEFAULT_CHANNEL_KEY = 'ml-cross-web-page-message'

export class CrossHander implements ICrossHander {

  private broadcastChannel: BroadcastChannel = null;

  private storeChannel: typeof window.localStorage | typeof window.sessionStorage = null;

  constructor(public channelKey: string = DEFAULT_CHANNEL_KEY) {
    if (typeof window.BroadcastChannel === 'function') {
      this.broadcastChannel = new BroadcastChannel(channelKey);
    } else if (typeof window.localStorage === 'object') {
      this.storeChannel = window.localStorage;
    } else if (typeof window.sessionStorage === 'object') {
      this.storeChannel = window.sessionStorage;
    }
  }
  send(message: string): void {
    if (this.broadcastChannel) {
      this.broadcastChannel.postMessage(message);
    } else if (this.storeChannel) {
      this.storeChannel.setItem(this.channelKey, message);
      //解决storage 是通过监听数据改变的机制无法出发再次响应问题
      this.storeChannel.removeItem(this.channelKey);
    } else {
      throw new Error('当前环境不支持 BroadcastChannel 、 LocalStorage 和 SessionStorage 两类进行跨网页通讯')
    }
  }

  /**
   * 连接器
   */
  attach(callback: ReceiveFunction) {
    const broadcastChannel = this.broadcastChannel;
    const emitCallback = (channelData: string) => {
      try {
        const { event, message } = JSON.parse(channelData) as IMessage;
        callback(event, message)
      } catch (e) {
        console.log('CrossHander-emitCallback-error', e);
      }
    }
    if (broadcastChannel) {
      broadcastChannel.onmessage = (event) => {
        emitCallback(event.data)
      };
    } else if (this.storeChannel) {
      window.addEventListener('storage', (event) => {
        if (event.key === this.channelKey && (event.newValue !== void 0 && event.newValue !== null)) {
          emitCallback(event.newValue)
        }
      });
    }
  }
}

export class CrossWebPageInvokeFactory extends EventEmitter {

  private crossHander: ICrossHander = null;

  constructor(public channelKey: string = DEFAULT_CHANNEL_KEY, crossHander?: ICrossHander) {
    super();
    if (crossHander) {
      this.crossHander = crossHander;
    } else {
      this.crossHander = new CrossHander(channelKey);
    }
    // 执行程序连接器,只要作用是绑定监听事件
    this.crossHander.attach((event, message) => {
      this.emit(event, event, message);
    });
  }
  /**
   * 发送消息
   * @param event 
   * @param message 
   */
  send(event: string, message: any) {
    /**
     * 将数据序列号,转为普通对象。由于页面间无法访问函数，所以需要序列化。
     */
    const data = JSON.stringify({ event, message })
    this.crossHander.send(data);
  }

  /**
   * 监听消息 alias on
   * @param event 
   * @param callback 
   * @param context 
   */
  receive(event: string, callback: (event: string, message: any) => void, context?: any) {
    this.on(event, callback, context)
  }
}

/**
 * 创建一个基础对象
 */
export const CrossWebPageInvoke = new CrossWebPageInvokeFactory(DEFAULT_CHANNEL_KEY)