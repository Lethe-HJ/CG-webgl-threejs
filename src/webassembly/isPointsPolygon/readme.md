安装最新的python https://www.python.org/downloads/ 安装时需要勾选加入环境变量
打开cmd
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
git pull
emsdk.bat install latest
emsdk.bat activate --permanent latest
emcc -v

emcc hello.c -s WASM=1 -o hello.html

emcc hello2.c -o hello2.js -s "EXTRA_EXPORTED_RUNTIME_METHODS=['cwrap']"

emcc calculate.c -o calculate.js -s "EXTRA_EXPORTED_RUNTIME_METHODS=['cwrap']" -s "EXPORTED_FUNCTIONS=['_malloc']"

清理编译缓存
emcc --clear-cache


开发环境下 编译支持调试
emcc calculate.c -o calculate_wasm.js -s "EXTRA_EXPORTED_RUNTIME_METHODS=['cwrap']" -s "EXPORTED_FUNCTIONS=['_malloc', '_free']" -g -fdebug-compilation-dir="./"

生产环境下编译优化
emcc calculate.c -o calculate_wasm.js -s "EXPORTED_FUNCTIONS=['_malloc', '_free', '_calculatePointsInPolygon']" -O3 -flto -s AGGRESSIVE_VARIABLE_ELIMINATION=1 -s ASYNCIFY=1  -msimd128


wasm浏览器调试工具
https://chromewebstore.google.com/detail/cc++-devtools-support-dwa/pdcpmagijalfljmkmjngeonclgbbannb