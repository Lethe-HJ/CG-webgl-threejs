import { glsl } from "./libs.js";

const sharedPenStruct = glsl`
  struct Pen {
    float size;
    vec3 color;
  };
`;

const paintVertexShaderSource = glsl`
  #version 300 es
  in vec4 a_paintPosition;
  ${sharedPenStruct}
  uniform Pen u_pen;
  
  void main() {
    gl_Position = vec4(a_paintPosition.xy, 0, 1);
    gl_PointSize = u_pen.size;
  }
`;

const paintFragmentShaderSource = glsl`
    #version 300 es
    precision highp float;
    out vec4 outColor;
    ${sharedPenStruct}
    uniform Pen u_pen;

    void main() {
      outColor = vec4(u_pen.color, 1.0);
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
      pen: {
        size: gl.getUniformLocation(program, "u_pen.size"),
        color: gl.getUniformLocation(program, "u_pen.color"),
      },
    },
    vao: gl.createVertexArray(),
    buffer: {
      position: gl.createBuffer(),
    },
  };
}
