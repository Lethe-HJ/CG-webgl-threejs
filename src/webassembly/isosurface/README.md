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