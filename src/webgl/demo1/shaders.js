export const basicShader = {
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

export const lambertShader = {
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

    struct Material {
      vec3 color;
      float shininess;
    };

    uniform Material u_material;

    struct PointLight {
      vec3 color; // 光源颜色
      vec3 position; // 光源位置
      float constant; // 光源常数衰减
      float linear; // 光源线性衰减
      float quadratic; // 光源二次衰减
    };

    uniform PointLight u_pointLight;

    void main() {
      vec4 color = vec4(u_material.color, 1.0); // 物体表面的颜色
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

export const phongShader = {
  vertex: /*glsl */ `
    precision highp float;
    precision mediump int;

    attribute vec4 a_position;
    attribute vec4 a_normal;
    uniform mat4 u_mvpMatrix;
    uniform mat4 u_normalMatrix;
    uniform mat4 u_modelMatrix;
    
    varying vec3 v_normal;
    varying vec3 v_fragPos; // 用于传递片元的世界坐标

    void main() {
      vec4 vertexPosition = u_mvpMatrix * a_position; // 顶点的世界坐标
      // 计算顶点的世界坐标并传递给片元着色器
      vec4 worldPosition = u_modelMatrix * a_position;
      v_fragPos = worldPosition.xyz;
      v_normal = normalize(vec3(u_normalMatrix * vec4(vec3(a_normal), 0.0)));
      gl_Position =  vertexPosition;
    }
  `,
  fragment: /*glsl */ `
    precision highp float;
    precision mediump int;

    varying vec3 v_normal; // 从顶点着色器传来的法线
    varying vec3 v_fragPos; // 从顶点着色器传来的片元位置

    uniform vec3 u_ambientLightColor; // 环境光颜色
    uniform vec3 u_cameraPosition; // 照相机位置 用来计算高光
    
    struct Material {
      vec3 color;
      float shininess;
    };

    uniform Material u_material;

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
      vec3 ambient = u_ambientLightColor * vec3(u_material.color);

      // 漫反射光
      vec3 norm = normalize(v_normal);
      vec3 lightDir = normalize(u_pointLight.position - v_fragPos);
      float diff = max(dot(norm, lightDir), 0.0);
      vec3 diffuse = diff * u_pointLight.color;

      // 高光
      vec3 viewDir = normalize(u_cameraPosition - v_fragPos);
      vec3 reflectDir = reflect(-lightDir, norm);
      float spec = pow(max(dot(viewDir, reflectDir), 0.0), u_material.shininess); // 32是高光系数，可调整
      vec3 shininess = u_pointLight.color * spec;
  
      // 计算衰减
      float dist = length(u_pointLight.position - v_fragPos);
      float attenuation = 1.0 / (u_pointLight.constant + u_pointLight.linear * dist + u_pointLight.quadratic * dist * dist);
      
      vec3 result = (ambient + (diffuse + shininess) * attenuation) * vec3(u_material.color);
      gl_FragColor = vec4(result, 1.0);
    }
  `,
};
