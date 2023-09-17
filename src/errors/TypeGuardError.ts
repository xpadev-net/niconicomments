/**
 * 型ガードで予期せず弾かれた場合に発生するエラー
 */
class TypeGuardError extends Error {
  constructor(options: { [key: string]: unknown } = {}) {
    super(
      "Type Guard Error\nAn error occurred due to unexpected values\nPlease contact the developer on GitHub",
      options,
    );
  }
}
TypeGuardError.prototype.name = "TypeGuardError";
export { TypeGuardError };
