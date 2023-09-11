/**
 * BaseCommentなどを継承しているプラグインで必要な関数を実装していない場合などに発生するエラー
 */
class NotImplementedError extends Error {
  pluginName: string;
  methodName: string;
  constructor(
    pluginName: string,
    methodName: string,
    options: { [key: string]: unknown } = {},
  ) {
    super("NotImplementedError", options);
    this.pluginName = pluginName;
    this.methodName = methodName;
  }
}
NotImplementedError.prototype.name = "NotImplementedError";
export { NotImplementedError };
