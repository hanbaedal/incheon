"use strict";

const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "..", "server", "routes");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".js"));

for (const file of files) {
  const p = path.join(dir, file);
  let src = fs.readFileSync(p, "utf8");
  if (!src.includes("requireAdmin")) continue;

  src = src.replace(
    /const \{([^}]+)\} = require\(["']\.\.\/middleware\/auth["']\);/,
    (m, inner) => {
      const names = inner
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
      if (!names.includes("requireStaff")) names.push("requireStaff");
      return `const { ${names.join(", ")} } = require("../middleware/auth");`;
    }
  );

  // router.get( ... requireAdmin,  → requireStaff
  // 여러 줄 형태 지원
  src = src.replace(
    /router\.get\(\s*([\s\S]*?),\s*requireAdmin\s*,/g,
    "router.get($1, requireStaff,"
  );

  fs.writeFileSync(p, src);
  console.log("patched GET:", file);
}

console.log("done");
