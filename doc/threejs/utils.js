const runJsInWebEnv = function (option) {
  const { display } = require("node-kernel");
  const prev_js = /*js*/ `
    window.container = document.querySelector('.output_html');
  `;
  const imports_map = { imports: option.imports };
  const html = /*html*/ `
    <script async src="https://unpkg.com/es-module-shims@1.8.0/dist/es-module-shims.js"></script>
    <script type="importmap-shim">${JSON.stringify(imports_map)}</script>
    <script type="module-shim">${prev_js + option.js}</script>
`;
  try {
    display.html(html);
  } catch (error) {
    console.log(error);
  }
};

module.exports = { runJsInWebEnv };
