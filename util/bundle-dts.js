const fs = require("fs");

const output = [];

const processDir = (dir = "./dist/") => {
    const files = fs.readdirSync(dir);
    for (const index in files){
        const item = files[index];
        if (fs.lstatSync(`${dir}/${item}`).isDirectory()){
            processDir(`${dir}/${item}/`)
        }else if (item.match(/\.d\.ts$/)){
            if (`${dir}/${item}`==="./dist/bundle.d.ts")continue;
            output.push(fs.readFileSync(`${dir}/${item}`, 'utf8'))
        }
    }
}

processDir();

fs.writeFileSync("./dist/bundle.d.ts",output.join("\n").replace(/export (default|\{).+;/g,"").replace(/import type \{.*?;/g,"").replace(/import\(".+?"\)\./,"").replace(/\/\/# sourceMappingURL=.+\.d\.ts\.map/g,"")+"\nexport default NiconiComments;");

