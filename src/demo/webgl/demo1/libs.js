var MaterialType = { None: 0, Lambert: 1, Phong: 2 };

var noneShader = {
  vertex: /*glsl */ `
    attribute vec4 a_position;
    uniform mat4 u_mvpMatrix;
    uniform vec3 u_materialColor;

    varying vec4 v_color;

    void main() {
      vec4 color = vec4(u_materialColor, 1.0); // 物体表面的颜色
      v_color = color;
      vec4 vertexPosition = u_mvpMatrix * a_position;
      gl_Position =  vertexPosition;
    }
  `,
  fragment: /*glsl */ `
    precision highp float;
    varying vec4 v_color; // 从顶点着色器传来的颜色值
    
    void main() {
        gl_FragColor = v_color;
    }
  `,
};

var lambertShader = {
  vertex: /*glsl */ `
      precision lowp float;
  
      attribute vec4 a_position;
      attribute vec4 a_normal;
      uniform vec3 u_ambientLightColor;
      uniform vec3 u_materialColor;
      uniform mat4 u_mvpMatrix;
      uniform mat4 u_normalMatrix;
      uniform mat4 u_modelMatrix;
      
  
      varying vec4 v_color;
  
      struct PointLight {
        vec3 color; // 光源颜色
        vec3 position; // 光源位置
        float constant; // 光源常数衰减
        float linear; // 光源线性衰减
        float quadratic; // 光源二次衰减
      };
  
      uniform PointLight u_pointLight;
  
      void main() {
        vec4 color = vec4(u_materialColor, 1.0); // 物体表面的颜色
        vec4 vertexPosition = u_mvpMatrix * a_position;
        vec4 worldPosition = u_modelMatrix * a_position; // 顶点的世界坐标
        vec3 lightDirection = normalize(u_pointLight.position - worldPosition.xyz); // 点光源的方向
        vec3 ambientColor = u_ambientLightColor * vec3(color); // 环境反射
        vec3 transformedNormal = normalize(vec3(u_normalMatrix * vec4(vec3(a_normal), 0.0)));
  
  
  
        //  计算衰减
        float dist = length(u_pointLight.position -  worldPosition.xyz);
        float attenuation = 1.0 / (u_pointLight.constant + u_pointLight.linear * dist + u_pointLight.quadratic * dist * dist);
  
        float dotDeg = max(dot(transformedNormal, lightDirection), 0.0); // 计算入射角 光线方向和法线方向的点积
        vec3 diffuseColor = u_pointLight.color * vec3(color) * dotDeg; // 漫反射光的颜色
        v_color = vec4(ambientColor + diffuseColor * attenuation, color.a);
        gl_Position =  vertexPosition;
      }
    `,
  fragment: /*glsl */ `
      precision lowp float;
  
      varying vec4 v_color;
      
      void main() {
        gl_FragColor = v_color;
      }
    `,
};

var phongShader = {
  vertex: /*glsl */ `
      precision highp float;
      precision mediump int;
  
      attribute vec4 a_position;
      attribute vec4 a_normal;
      uniform vec3 u_materialColor;
      uniform mat4 u_mvpMatrix;
      uniform mat4 u_normalMatrix;
      uniform mat4 u_modelMatrix;
      
  
      varying vec4 v_color;
      varying vec3 v_normal;
      varying vec3 v_fragPos; // 用于传递片元的世界坐标
  
      void main() {
        vec4 color = vec4(u_materialColor, 1.0); // 物体表面的颜色
        vec4 vertexPosition = u_mvpMatrix * a_position; // 顶点的世界坐标
        // 计算顶点的世界坐标并传递给片元着色器
        vec4 worldPosition = u_modelMatrix * a_position;
        v_fragPos = worldPosition.xyz;
        v_normal = normalize(vec3(u_normalMatrix * vec4(vec3(a_normal), 0.0)));
        v_color = color;
        gl_Position =  vertexPosition;
      }
    `,
  fragment: /*glsl */ `
      precision highp float;
      precision mediump int;
  
      varying vec4 v_color; // 从顶点着色器传来的颜色值
      varying vec3 v_normal; // 从顶点着色器传来的法线
      varying vec3 v_fragPos; // 从顶点着色器传来的片元位置
  
      uniform vec3 u_ambientLightColor; // 环境光颜色
      uniform vec3 u_cameraPosition; // 照相机位置 用来计算高光
      uniform vec3 u_materialSpecular; // 材质的高光系数
      
  
      struct PointLight {
        vec3 color; // 光源颜色
        vec3 position; // 光源位置
        float constant; // 光源常数衰减
        float linear; // 光源线性衰减
        float quadratic; // 光源二次衰减
      };
  
      uniform PointLight u_pointLight;
      
      void main() {
        // 环境光
        vec3 ambient = u_ambientLightColor * vec3(v_color);

        // 漫反射光
        vec3 norm = normalize(v_normal);
        vec3 lightDir = normalize(u_pointLight.position - v_fragPos);
        float diff = max(dot(norm, lightDir), 0.0);
        vec3 diffuse = diff * u_pointLight.color;

        // 高光
        vec3 viewDir = normalize(u_cameraPosition - v_fragPos);
        vec3 reflectDir = reflect(-lightDir, norm);
        float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32.0); // 32是高光系数，可调整
        vec3 specular = u_pointLight.color * spec;
    
        // 计算衰减
        float dist = length(u_pointLight.position - v_fragPos);
        float attenuation = 1.0 / (u_pointLight.constant + u_pointLight.linear * dist + u_pointLight.quadratic * dist * dist);
        
        vec3 result = (ambient + (diffuse + specular) * attenuation) * vec3(v_color);
        gl_FragColor = vec4(result, 1.0);
      }
    `,
};

var shaders = {
  [MaterialType.None]: noneShader,
  [MaterialType.Lambert]: lambertShader,
  [MaterialType.Phong]: phongShader,
};

var m4 = {
  perspective(fieldOfViewInRadians, aspect, near, far) {
    var f = Math.tan(Math.PI * 0.5 - 0.5 * fieldOfViewInRadians);
    var rangeInv = 1.0 / (near - far);
    // prettier-ignore
    return [
      f / aspect, 0, 0,                         0,
      0,          f, 0,                         0,
      0,          0, (near + far) * rangeInv,   -1,
      0,          0, near * far * rangeInv * 2, 0
    ];
  },

  projection(width, height, depth) {
    // Note: This matrix flips the Y axis so 0 is at the top.
    // prettier-ignore
    return [
      2 / width,  0,            0,          0,
      0,          -2 / height,  0,          0,
      0,          0,            2 / depth,  0,
      -1,         1,            0,          1, 
    ];
  },

  translation(tx, ty, tz) {
    // prettier-ignore
    return [
      1,  0,  0,  0,
      0,  1,  0,  0,
      0,  0,  1,  0,
      tx, ty, tz, 1,
    ];
  },

  xRotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
      1, 0, 0, 0,
      0, c, s, 0,
      0, -s, c, 0,
      0, 0, 0, 1,
    ];
  },

  yRotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    // prettier-ignore
    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  },

  zRotation(angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);
    // prettier-ignore
    return new Float32Array([
      c, s, 0, 0,
      -s, c, 0, 0,
      0, 0, 1, 0,
      0, 0, 0, 1,
    ]);
  },

  scaling(sx, sy, sz) {
    // prettier-ignore
    return [
      sx, 0,  0,  0,
      0, sy,  0,  0,
      0,  0, sz,  0,
      0,  0,  0,  1,
    ];
  },

  translate(m, tx, ty, tz) {
    return m4.multiply(m, m4.translation(tx, ty, tz));
  },

  xRotate(m, angleInRadians) {
    return m4.multiply(m, m4.xRotation(angleInRadians));
  },

  yRotate(m, angleInRadians) {
    return m4.multiply(m, m4.yRotation(angleInRadians));
  },

  zRotate(m, angleInRadians) {
    return m4.multiply(m, m4.zRotation(angleInRadians));
  },

  scale(m, sx, sy, sz) {
    return m4.multiply(m, m4.scaling(sx, sy, sz));
  },

  inverse(m) {
    var m00 = m[0 * 4 + 0];
    var m01 = m[0 * 4 + 1];
    var m02 = m[0 * 4 + 2];
    var m03 = m[0 * 4 + 3];
    var m10 = m[1 * 4 + 0];
    var m11 = m[1 * 4 + 1];
    var m12 = m[1 * 4 + 2];
    var m13 = m[1 * 4 + 3];
    var m20 = m[2 * 4 + 0];
    var m21 = m[2 * 4 + 1];
    var m22 = m[2 * 4 + 2];
    var m23 = m[2 * 4 + 3];
    var m30 = m[3 * 4 + 0];
    var m31 = m[3 * 4 + 1];
    var m32 = m[3 * 4 + 2];
    var m33 = m[3 * 4 + 3];
    var tmp_0 = m22 * m33;
    var tmp_1 = m32 * m23;
    var tmp_2 = m12 * m33;
    var tmp_3 = m32 * m13;
    var tmp_4 = m12 * m23;
    var tmp_5 = m22 * m13;
    var tmp_6 = m02 * m33;
    var tmp_7 = m32 * m03;
    var tmp_8 = m02 * m23;
    var tmp_9 = m22 * m03;
    var tmp_10 = m02 * m13;
    var tmp_11 = m12 * m03;
    var tmp_12 = m20 * m31;
    var tmp_13 = m30 * m21;
    var tmp_14 = m10 * m31;
    var tmp_15 = m30 * m11;
    var tmp_16 = m10 * m21;
    var tmp_17 = m20 * m11;
    var tmp_18 = m00 * m31;
    var tmp_19 = m30 * m01;
    var tmp_20 = m00 * m21;
    var tmp_21 = m20 * m01;
    var tmp_22 = m00 * m11;
    var tmp_23 = m10 * m01;

    var t0 =
      tmp_0 * m11 +
      tmp_3 * m21 +
      tmp_4 * m31 -
      (tmp_1 * m11 + tmp_2 * m21 + tmp_5 * m31);
    var t1 =
      tmp_1 * m01 +
      tmp_6 * m21 +
      tmp_9 * m31 -
      (tmp_0 * m01 + tmp_7 * m21 + tmp_8 * m31);
    var t2 =
      tmp_2 * m01 +
      tmp_7 * m11 +
      tmp_10 * m31 -
      (tmp_3 * m01 + tmp_6 * m11 + tmp_11 * m31);
    var t3 =
      tmp_5 * m01 +
      tmp_8 * m11 +
      tmp_11 * m21 -
      (tmp_4 * m01 + tmp_9 * m11 + tmp_10 * m21);

    var d = 1.0 / (m00 * t0 + m10 * t1 + m20 * t2 + m30 * t3);
    // prettier-ignore
    return [
        d * t0,
        d * t1,
        d * t2,
        d * t3,
        d * ((tmp_1 * m10 + tmp_2 * m20 + tmp_5 * m30) -
            (tmp_0 * m10 + tmp_3 * m20 + tmp_4 * m30)),
        d * ((tmp_0 * m00 + tmp_7 * m20 + tmp_8 * m30) -
            (tmp_1 * m00 + tmp_6 * m20 + tmp_9 * m30)),
        d * ((tmp_3 * m00 + tmp_6 * m10 + tmp_11 * m30) -
            (tmp_2 * m00 + tmp_7 * m10 + tmp_10 * m30)),
        d * ((tmp_4 * m00 + tmp_9 * m10 + tmp_10 * m20) -
            (tmp_5 * m00 + tmp_8 * m10 + tmp_11 * m20)),
        d * ((tmp_12 * m13 + tmp_15 * m23 + tmp_16 * m33) -
            (tmp_13 * m13 + tmp_14 * m23 + tmp_17 * m33)),
        d * ((tmp_13 * m03 + tmp_18 * m23 + tmp_21 * m33) -
            (tmp_12 * m03 + tmp_19 * m23 + tmp_20 * m33)),
        d * ((tmp_14 * m03 + tmp_19 * m13 + tmp_22 * m33) -
            (tmp_15 * m03 + tmp_18 * m13 + tmp_23 * m33)),
        d * ((tmp_17 * m03 + tmp_20 * m13 + tmp_23 * m23) -
            (tmp_16 * m03 + tmp_21 * m13 + tmp_22 * m23)),
        d * ((tmp_14 * m22 + tmp_17 * m32 + tmp_13 * m12) -
            (tmp_16 * m32 + tmp_12 * m12 + tmp_15 * m22)),
        d * ((tmp_20 * m32 + tmp_12 * m02 + tmp_19 * m22) -
            (tmp_18 * m22 + tmp_21 * m32 + tmp_13 * m02)),
        d * ((tmp_18 * m12 + tmp_23 * m32 + tmp_15 * m02) -
            (tmp_22 * m32 + tmp_14 * m02 + tmp_19 * m12)),
        d * ((tmp_22 * m22 + tmp_16 * m02 + tmp_21 * m12) -
            (tmp_20 * m12 + tmp_23 * m22 + tmp_17 * m02))
      ];
  },

  // prettier-ignore
  transpose: function(m) {
      return [
        m[0], m[4], m[8], m[12],
        m[1], m[5], m[9], m[13],
        m[2], m[6], m[10], m[14],
        m[3], m[7], m[11], m[15],
      ];
    },

  lookAt(cameraPosition, target, up) {
    var zAxis = v3.normalize(v3.subtractVectors(cameraPosition, target));
    var xAxis = v3.normalize(v3.cross(up, zAxis));
    var yAxis = v3.normalize(v3.cross(zAxis, xAxis));
    // prettier-ignore
    return [
        xAxis[0],       xAxis[1],      xAxis[2],        0,
        yAxis[0],       yAxis[1],      yAxis[2],        0,
        zAxis[0],       zAxis[1],      zAxis[2],        0,
        cameraPosition[0], cameraPosition[1], cameraPosition[2], 1,
      ];
  },

  multiply(a, b) {
    var a00 = a[0 * 4 + 0];
    var a01 = a[0 * 4 + 1];
    var a02 = a[0 * 4 + 2];
    var a03 = a[0 * 4 + 3];
    var a10 = a[1 * 4 + 0];
    var a11 = a[1 * 4 + 1];
    var a12 = a[1 * 4 + 2];
    var a13 = a[1 * 4 + 3];
    var a20 = a[2 * 4 + 0];
    var a21 = a[2 * 4 + 1];
    var a22 = a[2 * 4 + 2];
    var a23 = a[2 * 4 + 3];
    var a30 = a[3 * 4 + 0];
    var a31 = a[3 * 4 + 1];
    var a32 = a[3 * 4 + 2];
    var a33 = a[3 * 4 + 3];
    var b00 = b[0 * 4 + 0];
    var b01 = b[0 * 4 + 1];
    var b02 = b[0 * 4 + 2];
    var b03 = b[0 * 4 + 3];
    var b10 = b[1 * 4 + 0];
    var b11 = b[1 * 4 + 1];
    var b12 = b[1 * 4 + 2];
    var b13 = b[1 * 4 + 3];
    var b20 = b[2 * 4 + 0];
    var b21 = b[2 * 4 + 1];
    var b22 = b[2 * 4 + 2];
    var b23 = b[2 * 4 + 3];
    var b30 = b[3 * 4 + 0];
    var b31 = b[3 * 4 + 1];
    var b32 = b[3 * 4 + 2];
    var b33 = b[3 * 4 + 3];
    // prettier-ignore
    return [
        b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
        b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
        b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
        b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,
        b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
        b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
        b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
        b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,
        b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
        b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
        b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
        b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,
        b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
        b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
        b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
        b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
      ];
  },
};

var v3 = {
  vectorMultiply(v, m) {
    var dst = [];
    for (var i = 0; i < 4; ++i) {
      dst[i] = 0.0;
      for (var j = 0; j < 4; ++j) {
        dst[i] += v[j] * m[j * 4 + i];
      }
    }
    return dst;
  },

  cross(a, b) {
    return [
      a[1] * b[2] - a[2] * b[1],
      a[2] * b[0] - a[0] * b[2],
      a[0] * b[1] - a[1] * b[0],
    ];
  },
  subtractVectors(a, b) {
    return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
  },
  normalize(v) {
    var length = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
    // 确定不会除以 0
    if (length > 0.00001) {
      return [v[0] / length, v[1] / length, v[2] / length];
    } else {
      return [0, 0, 0];
    }
  },
};