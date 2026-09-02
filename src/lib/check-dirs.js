const fs = require("fs");
const path = require("path");

function walk(dir) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const full = path.join(dir, f);
    const stat = fs.statSync(full);
    console.log(stat.isDirectory() ? "[DIR]" : "[FILE]", full);
    if (stat.isDirectory()) {
      walk(full);
    }
  }
}

walk("src/app/api");
