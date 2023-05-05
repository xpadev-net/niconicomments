const fs = require("fs");

const processDir = (dir = "./dist/dts", deps = 0) => {
  const files = fs.readdirSync(dir);
  for (const item of files) {
    const path = `${dir}/${item}`;
    if (fs.lstatSync(`${path}`).isDirectory()) {
      processDir(`${path}/`, deps + 1);
    } else if (item.match(/\.d\.ts$/)) {
      if (`${path}` === "./dist/bundle.d.ts") continue;

      const content = fs
        .readFileSync(path, "utf-8")
        .replace(/@\//g, "./" + "../".repeat(deps))
        .replace(/\/\/# sourceMappingURL=.+\.d\.ts\.map/g, "");
      fs.writeFileSync(path, content, "utf-8");
    }
  }
};

processDir();
