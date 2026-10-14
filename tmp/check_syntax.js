const fs = require("fs");
const ts = require("typescript");

const src = fs.readFileSync("server.ts", "utf8");
const sf = ts.createSourceFile("server.ts", src, ts.ScriptTarget.Latest, true);

// Find all statements in startServer
function inspect(node) {
  if (ts.isFunctionDeclaration(node) && node.name?.text === "startServer") {
    console.log("startServer body statements:", node.body?.statements.length);
    node.body?.statements.forEach((stmt) => {
      const line = sf.getLineAndCharacterOfPosition(stmt.getStart()).line + 1;
      const endLine = sf.getLineAndCharacterOfPosition(stmt.getEnd()).line + 1;
      const text = stmt.getText(sf).slice(0, 50).replace(/\n/g, " ");
      console.log(`L${line}-L${endLine}: ${text}`);
    });
  }
  ts.forEachChild(node, inspect);
}
inspect(sf);
