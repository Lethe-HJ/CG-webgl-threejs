var defaultVertexShader = /*glsl*/ `
    attribute vec4 a_position;
    void main(){
        gl_Position = a_position;
    }
`;

function displayShader(fragmentShader, vertexShader = defaultVertexShader) {
  const { display } = require("node-kernel");
  const id = new Date().getTime();
  const js = /*js*/ `
        const checkInterval = setInterval(function() {
            if (typeof GlslCanvas !== "undefined") {
                clearInterval(checkInterval); // 停止轮询
                const container = document.querySelector('#container${id}');
                var canvas = document.createElement("canvas");
                var sandbox = new GlslCanvas(canvas);
                sandbox.load("${fragmentShader.replace(
                  /\n/g,
                  "\\n"
                )}", "${vertexShader.replace(/\n/g, "\\n")}");
                container.appendChild(canvas);
            }
        }, 10); // 每10毫秒检查一次
    `;

  const html = /*html*/ `
        <div id="container${id}" style="width:300px;height:150px;position:relative;"></div>
        <script src="../../node_modules/glslCanvas/dist/GlslCanvas.js"></script>
        <script type="module">${js}</script>
    `;
  display.html(html);
}

module.exports = {
  displayShader,
};
