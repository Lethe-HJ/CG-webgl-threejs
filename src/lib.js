 // 视图矩阵获取
 function getViewMatrix(eyex, eyey, eyez, lookAtx, lookAty, lookAtz, upx, upy, upz) {

    // 视点
    const eye = new Float32Array([eyex, eyey, eyez])
    // 目标点
    const lookAt = new Float32Array([lookAtx, lookAty, lookAtz])
    // 上方向
    const up = new Float32Array([upx, upy, upz])

    // 确定z轴
    const z = minus(eye, lookAt);

    normalized(z);
    normalized(up);

    // 确定x轴
    const x = cross(z, up);

    normalized(x);
    // 确定y轴
    const y = cross(x, z);

    return new Float32Array([
        x[0],       y[0],       z[0],       0,
        x[1],       y[1],       z[1],       0,
        x[2],       y[2],       z[2],       0,
        -dot(x,eye),-dot(y,eye),-dot(z,eye),1
    ])
}

// 获取正射投影矩阵
function getOrtho(l, r, t, b, n, f) {
    return new Float32Array([
        2 / (r - l), 0,           0,           0,
        0,           2/(t-b),     0,           0,
        0,           0,           -2/(f-n),    0,
        -(r+l)/(r-l),-(t+b)/(t-b),-(f+n)/(f-n),1
    ])
}