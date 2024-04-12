import { glsl } from "./libs.js";

const vertexShaderSource = glsl`
    #version 300 es
    in vec4 a_position;
    in vec2 a_texCoords;

    out vec2 v_texCoord;

    void main() {
        gl_Position = vec4(a_position.x, a_position.y, 0.0, 1.0);
        v_texCoord = a_texCoords;
    }
`;

const fragmentShaderSource = glsl`
    #version 300 es
    precision highp float;

    in vec2 v_texCoord;
    uniform sampler2D u_texture;

    out vec4 outColor;

    void main() {
        outColor = texture(u_texture, v_texCoord);
    }
`;

// createFrameBufferShader createImageShader Exported function to create an image shader.
export default function createFrameBufferShader(gl) {
  const program = webglUtils.createProgramFromSources(gl, [
    vertexShaderSource,
    fragmentShaderSource,
  ]);

  return {
    program,
    location: {
      position: gl.getAttribLocation(program, "a_position"),
      texCoords: gl.getAttribLocation(program, "a_texCoords"),
      texture: gl.getUniformLocation(program, "u_texture"),
    },
    attribute: {
      position: gl.getAttribLocation(program, "a_position"),
      texCoord: gl.getAttribLocation(program, "a_texCoord"),
    },
    uniform: {
      texture: gl.getUniformLocation(program, "u_texture"),
    },
    vao: gl.createVertexArray(),
    buffer: {
      position: gl.createBuffer(),
      texCoords: gl.createBuffer(),
    },
  };
}
