/**
 * interface
 */
export type IMessage<T extends any = any> = {
    type: string,
    message: T
}

export interface ReceiveFunction<T extends any = any> {
    (type: IMessage['type'], message: IMessage<T>['message']): void
}

export interface ICrossHander {
    attach(callback: ReceiveFunction): void;
    send(message: string): void;
}