
npm install --save-exact --save-dev esbuild

普通构建

```js
import * as esbuild from 'esbuild'

let result = await esbuild.build({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
})
console.log(result)
```

观察模式

```js

let ctx = await esbuild.context({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
})

await ctx.watch()
```

服务模式

```js
let ctx = await esbuild.context({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
})

let { host, port } = await ctx.serve()
```

重新构建模式

```js
let ctx = await esbuild.context({
  entryPoints: ['app.ts'],
  bundle: true,
  outdir: 'dist',
})

for (let i = 0; i < 5; i++) {
  let result = await ctx.rebuild()
}
```


转换

```js
import * as esbuild from 'esbuild'

let ts = 'let x: number = 1'
let result = await esbuild.transform(ts, {
  loader: 'ts',
})
console.log(result)
```

同步api

```js
let esbuild = require('esbuild')

let result1 = esbuild.transformSync(code, options)
let result2 = esbuild.buildSync(options)
```

构建wasm

npm install esbuild-wasm

```js
import * as esbuild from 'esbuild-wasm'

await esbuild.initialize({
  wasmURL: './node_modules/esbuild-wasm/esbuild.wasm',
})

let result1 = await esbuild.transform(code, options)
let result2 = esbuild.build(options)
```


打包

```js
import * as esbuild from 'esbuild'

console.log(await esbuild.build({
  entryPoints: ['in.js'],
  bundle: true,
  outfile: 'out.js',
}))
```

入口点

```js
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['home.ts', 'settings.ts'],
  bundle: true,
  write: true,
  outdir: 'out',
})
```


```js
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: [
    { out: 'out1', in: 'home.ts'},
    { out: 'out2', in: 'settings.ts'},
  ],
  bundle: true,
  write: true,
  outdir: 'out',
})
```


加载器

```js
import url from './example.png'
let image = new Image
image.src = url
document.body.appendChild(image)

import svg from './example.svg'
let doc = new DOMParser().parseFromString(svg, 'application/xml')
let node = document.importNode(doc.documentElement, true)
document.body.appendChild(node)

```

```js
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  loader: {
    '.png': 'dataurl',
    '.svg': 'text',
  },
  outfile: 'out.js',
})

```


拆分

```js
import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['home.ts', 'about.ts'],
  bundle: true,
  splitting: true,
  outdir: 'out',
  format: 'esm',
})

```

写入


```js
import * as esbuild from 'esbuild'

let result = await esbuild.build({
  entryPoints: ['app.js'],
  sourcemap: 'external',
  write: false,
  outdir: 'out',
})

for (let out of result.outputFiles) {
  console.log(out.path, out.contents, out.hash, out.text)
}
```

包


```js

import * as esbuild from 'esbuild'

await esbuild.build({
  entryPoints: ['app.js'],
  bundle: true,
  packages: 'external',
})
```