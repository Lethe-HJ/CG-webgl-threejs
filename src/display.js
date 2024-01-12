const { display } = require("node-kernel");

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

function initShader(gl, VERTEX_SHADER_SOURCE, FRAGMENT_SHADER_SOURCE) {
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);

    gl.shaderSource(vertexShader, VERTEX_SHADER_SOURCE); // 指定顶点着色器的源码
    gl.shaderSource(fragmentShader, FRAGMENT_SHADER_SOURCE); // 指定片元着色器的源码

    // 编译着色器
    gl.compileShader(vertexShader);
    gl.compileShader(fragmentShader);

    // 创建一个程序对象
    const program = gl.createProgram();

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);

    gl.linkProgram(program);

    gl.useProgram(program);

    return program;
}

function renderWebgl(vertex, fragment, js) {
    const { v1: uuidv1 } = require("uuid");
    const canvas_id = uuidv1();
    vertex = vertex.replace(/\n/g, "\\n");
    fragment = fragment.replace(/\n/g, "\\n");
    const pre_js = /*js*/ `
        const ctx = document.getElementById('${canvas_id}');
        const gl = ctx.getContext('webgl');
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    
        gl.shaderSource(vertexShader,  "${vertex}"); // 指定顶点着色器的源码
        gl.shaderSource(fragmentShader,  "${fragment}"); // 指定片元着色器的源码
    
        // 编译着色器
        gl.compileShader(vertexShader);
        gl.compileShader(fragmentShader);
    
        // 创建一个程序对象
        const program = gl.createProgram();
    
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
    
        gl.linkProgram(program);
    
        gl.useProgram(program);
    `;
    js = pre_js + js;
    let html = /*html*/ `
        <canvas id="${canvas_id}" width="400" height="400" style="border:1px solid grey">
            此浏览器不支持canvas
        </canvas>
        <script>
            { // 限制变量定义域
                ${js}
            }
        </script>
    `;
    debugger
    html = global_scripts.join('\n') + html;
    display.html(html);
}

function renderIframe(html, js) {
    display.html(/*html*/ `
        <iframe id="iframe" srcdoc="${html}"></iframe>
        <script>
            const iframe = document.getElementById('iframe');
            const script = iframe.contentDocument.createElement('script');
            script.text = "${js}";
            iframe.contentDocument.head.appendChild(script);
        </script>
    `);
}

function runJsInWeb(js) {
    let html = /*html*/ `
        <script>
            { // 限制变量定义域
                ${js}
            }
        </script>
    `;
    html += global_scripts.join('\n');
    console.log(html)
    display.html(html);
}

const global_scripts = [];

function declareFunction(js) {
    global_scripts.push(/*html*/ `
        <script>
            ${js}
        </script>
    `);
}

module.exports = {
    displayShader,
    renderWebgl,
    renderIframe,
    runJsInWeb,
    declareFunction,
};
