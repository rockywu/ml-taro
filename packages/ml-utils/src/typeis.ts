export function isProxy(obj: object) {
  return Object.prototype.toString.call(obj) === "[object Proxy]";
}