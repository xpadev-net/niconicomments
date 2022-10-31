const canvas = document.createElement("canvas");
const _context = canvas.getContext("2d");
if (_context === null) throw new Error("fail to get Context2D");
const context = _context;
context.textAlign = "start";
context.textBaseline = "alphabetic";
export { canvas, context };
