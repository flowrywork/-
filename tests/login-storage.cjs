const assert = require("node:assert/strict");
const fs = require("node:fs");
const app = fs.readFileSync("web/app.js", "utf8");
const sw = fs.readFileSync("web/service-worker.js", "utf8");
assert.match(app, /eco-mvp-v030/);
assert.match(sw, /eco-mvp-v030/);
assert.match(app, /sessionStorage/);
console.log("login-storage: ok");
