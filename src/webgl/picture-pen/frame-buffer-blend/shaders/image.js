import { glsl } from "../libs.js";

const vertexShaderSource = glsl`
  #version 300 es
  in vec4 a_position;
  in vec2 a_texCoords;
  uniform mat4 u_matrix;
  out vec2 v_texCoords;
  void main() {
    gl_Position = u_matrix * a_position;
    v_texCoords = a_texCoords;
  }
`;

const fragmentShaderSource = glsl`
    #version 300 es
    precision highp float;
    in vec2 v_texCoords;
    uniform sampler2D u_texture;
    out vec4 outColor;
    void main() {
      outColor = texture(u_texture, v_texCoords);
      // outColor =vec4(texture(u_texture, v_texCoords).rgb, 0.5);
    }
`;

// createImageShader Exported function to create an image shader.
export default function createImageShader(gl) {
  const program = webglUtils.createProgramFromSources(gl, [
    vertexShaderSource,
    fragmentShaderSource,
  ]);

  return {
    program,
    location: {
      position: gl.getAttribLocation(program, "a_position"),
      texCoords: gl.getAttribLocation(program, "a_texCoords"),
      matrix: gl.getUniformLocation(program, "u_matrix"),
      texture: gl.getUniformLocation(program, "u_texture"),
    },
    vao: gl.createVertexArray(),
    buffer: {
      position: gl.createBuffer(),
      texCoords: gl.createBuffer(),
    },
  };
}
