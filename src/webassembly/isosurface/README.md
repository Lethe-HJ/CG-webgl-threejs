## 编译c成wasm

[下载python](https://www.python.org/)

使用cmd
```powershell
git clone https://github.com/juj/emsdk.git
cd emsdk
.\emsdk.bat update
.\emsdk.bat install latest
.\emsdk.bat activate latest
.\emsdk_env.bat
emcc -v
```

```bat
cd ..\emsdk
.\emsdk_env.bat 
emcc -v
cd ..\CG-webgl-threejs\src\webassembly\isosurface

set TOTAL_MEMORY=1073741824
set EXPORTED_FUNCTIONS="['_malloc', '_free']"

emcc surfaceNets.c -s EXPORTED_FUNCTIONS=%EXPORTED_FUNCTIONS% -s TOTAL_MEMORY=%TOTAL_MEMORY% -o surfaceNets_wasm.js
```
上面的1073741824 = 1 * 1024 * 1024 * 1024 表示内存1G
2147483648 2G
3221225472 3G
4294967296 4G