class InvalidOptionError extends Error {
  constructor(options: { [key: string]: unknown } = {}) {
    super(
      "Invalid option\nPlease check document: https://xpadev-net.github.io/niconicomments/#p_options",
      options
    );
  }
}
InvalidOptionError.prototype.name = "InvalidOptionError";
export { InvalidOptionError };
