class NotImplementedError extends Error {
  pluginName: string;
  methodName: string;
  static {
    this.prototype.name = "NotImplementedError";
  }
  constructor(
    pluginName: string,
    methodName: string,
    options: { [key: string]: unknown } = {}
  ) {
    super("NotImplementedError", options);
    this.pluginName = pluginName;
    this.methodName = methodName;
  }
}
export { NotImplementedError };
