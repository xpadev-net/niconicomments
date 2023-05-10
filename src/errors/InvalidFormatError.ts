/**
 * 入力されたフォーマットが正しくない際に発生するエラー
 */
class InvalidFormatError extends Error {
  constructor(options: { [key: string]: unknown } = {}) {
    super("InvalidFormatError", options);
  }
}
InvalidFormatError.prototype.name = "InvalidFormatError";
export { InvalidFormatError };
