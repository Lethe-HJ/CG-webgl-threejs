import { glsl } from "./libs.js";

const paintVertexShaderSource = glsl`
  #version 300 es
  in vec4 a_paintPosition;
  void main() {
    gl_Position = vec4(a_paintPosition.xy, 0, 1);
    gl_PointSize = 4.0;
  }
`;

const paintFragmentShaderSource = glsl`
    #version 300 es
    precision highp float;
    out vec4 outColor;
    void main() {
      outColor = vec4(1, 0, 0, 1);
    }
`;

// createPaintShader Exported function to create a paint shader.
export default function createPaintShader(gl) {
  const program = webglUtils.createProgramFromSources(gl, [
    paintVertexShaderSource,
    paintFragmentShaderSource,
  ]);

  return {
    program,
    location: {
      position: gl.getAttribLocation(program, "a_paintPosition"),
    },
    vao: gl.createVertexArray(),
    buffer: {
      position: gl.createBuffer(),
    },
  };
}
