const fs = require('node:fs');
const path = require('node:path');
const Module = require('node:module');
const ts = require('typescript');
const originalLoad = Module._load;
Module._load = function(id, parent, main) {
  if (id === 'server-only') return {};
  if (id.startsWith('@/')) id = path.join(__dirname, '..', id.slice(2));
  return originalLoad.call(this, id, parent, main);
};
for (const extension of ['.ts', '.tsx']) require.extensions[extension] = (module, file) => module._compile(ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true, target: ts.ScriptTarget.ES2022 },
}).outputText, file);
