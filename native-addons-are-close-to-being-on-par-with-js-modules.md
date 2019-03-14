# Native Addons Are Close To Being On Par With JS Modules

Native addons have been a part of Node.js since the very beginning. So have JS modules 😉 So, what does it mean that they are now close to being "on-par"? Why only now?

Let's first look at the similarities between native adons and JS modules. Both can be `require()`-ed:

```JS
// A JS module can be loaded from a package:
const jsModulePackage = require('my-js-module');
// It can also be loaded from a specific file:
const jsModuleFile = require('./my-js-module.js');

// A native addon can also be loaded from a file:
const nativeAddonFile = require('./build/Release/my-native-addon.node');
```

Both return a JavaScript object containing useful functionality which would otherwise be completely unavailable, or which would otherwise take a long time to implement.

Nevertheless, the similarities end there. Let's now contrast the two types of modules:

|  |  | JavaScript modules | Native addons |
|--- |--- |--- |--- |
| 1. | ... need to be compiled. | No | Not if there are pre-builds |
| 2. | ... will work on all platforms and architectures. | Yes | Yes if there are pre-builds |
| 3. | ... will work with all current and subsequent Node.js versions once written. | Yes | No |
| 4. | ... can be loaded multiple times. | Yes | No |
| 5. | ... are thread-safe if not explicitly making use of threading infrastructure. | Yes | No |

These differences have created a sizeable maintenance burden for those who choose to publish native addons, and for those whose deployed applications include native addons.

### 1. Compilation
This will always be a fundamental difference between native addons and JavaScript modules. The process whereby source code written in C or C++ (or even a different language such as Rust or Go) gets bundled into a native addon will always be an extra step in addition to publishing an npm package which users can consume. In fact, if the maintainer does not take the time to provide pre-built packages by using tools such as [node-pre-gyp][] or [prebuild][], then those who would depend on the native addon have to install a compiler and build tool chain to allow the native addon package to build on their system. Nevertheless, npm packages providing pre-built native addons can make it appear as though a native addon can be installed as easily as a JavaScript module.

### 2. Platform And Architecture Independence
A single `.js` file defines a single JavaScript module because fundamentally it is nothing more than plain text which is read in from the file system by Node.js and then interpreted. In contrast, a native addon is a binary containing machine code much like Node.js itself. Thus, a single binary can only serve a specific type of machine running a specific type of operating system. For example, a single binary can only serve Windows running on x86 (Intel or AMD). A different binary is needed for OSX on x86, and yet another one is needed for Linux on x86 and so on. Addon maintainers' tools such as node-pre-gyp and prebuild can bridge this gap as well. They make it possible for maintainers to produce a binary for each platform/architecture combination they wish to support so that at package installation time, the npm install script can choose such a binary, download it, and give it to Node.js for loading and execution.

### 3. Node.js Version Independence
JavaScript modules, once written, will work on the version of Node.js for which they were written, *and on all subsequent versions*. In contrast, native addons are tied to the version of Node.js for which they were written. For a given platform and architecture, a different binary has to be provided for version 8.x of Node.js than for version 10.x. The reason for this is that the native API provided by Node.js to native addon developers can change from one major version to the next in such a way that the native addon will no longer load, or, in the worst case, it will load but crash seemingly inexplicably. To save many hours of hunting down seemingly inexplicable crashes, a simple versioning scheme based on a single integer value was added, whereby the Node.js version against which an addon was built is recorded within the addon and examined upon loading the addon. If the value does not match the value carried by Node.js, it will fail to load the addon, producing a familiar message:

```
Error: The module '/home/user/node_hello_world/build/Release/hello.node'
was compiled against a different Node.js version using
NODE_MODULE_VERSION 57. This version of Node.js requires
NODE_MODULE_VERSION 64. Please try re-compiling or re-installing
the module (for instance, using `npm rebuild` or `npm install`).
    at Object.Module._extensions..node (internal/modules/cjs/loader.js:718:18)
    at Module.load (internal/modules/cjs/loader.js:599:32)
    at tryModuleLoad (internal/modules/cjs/loader.js:538:12)
    at Function.Module._load (internal/modules/cjs/loader.js:530:3)
    at Module.require (internal/modules/cjs/loader.js:637:17)
    at require (internal/modules/cjs/helpers.js:22:18)
    at bindings (/home/user/node_hello_world/node_modules/bindings/bindings.js:76:44)
    at Object.<anonymous> (/home/user/node_hello_world/hello.js:1:94)
    at Module._compile (internal/modules/cjs/loader.js:689:30)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:700:10)
```

Such errors can also be avoided by the use of prebuild utilities, however, it places even more burden on addon maintainers, namely, to rebuild the binaries they provide at every release of Node.js. It also prevents application maintainers from simply dropping a new version of Node.js into their production environment. Indeed they need to reinstall their application even though no part of its functionality has changed.

[N-API][] was introduced to address the problem of the binary compatibility of native addons with versions of Node.js against which they were build *as well as all subsequent versions*. It abstracts away essential JavaScript engine and Node.js APIs, presenting them to native addon maintainers as a collection of ABI-stable APIs. The stability of N-API is assured by the fact that all APIs are C APIs rather than C++ APIs and by a commitment on the part of the Node.js core developer community to avoid modifying the interface in an incompatible way.

N-API eliminates one of the three variables that causes the proliferation of binaries required to provide a single Node.js native addon: the integer value that represents the Node.js version against which the binary is designed to work (`NODE_MODULE_VERSION`).

### 4. Multiple Loading
The advent of worker threads in Node.js, and even earlier modules such as [`vm`][], make it possible to load modules multiple times. This is easy to do with JavaScript modules because Node.js simply re-reads and re-interprets the file defining the JavaScript module and the resulting object resides in a separate context, without inadvertently sharing any state with its previously loaded incarnation. In contrast, it has only recently become possible to load native addons more than once. The reason for this is architectural. In particular, it is because the mechanism for loading a native addon was as follows:

0. Node.js calculates the absolute path to the native addon.
0. Node.js calls the method [`process.dlopen()`][], passing in the absolute path previously calculated.
0. On the native side, Node.js calls [`dlopen(3)`][] or [`uv_dlopen()`][] on Windows.
0. The addon is loaded and it executes a so-called DSO constructor function as part of the loading process. The function passes a pointer to a structure of type `node::nm_module` to Node.js.
0. The `node::node_module::nm_register_func` or `node::node_module::nm_context_register_func` member of the structure holds a pointer to a function which is responsible for populating the object which will become the result of having loaded the module (`module.exports`).

The problem with DSO constructor functions is that they only run the first time an addon is loaded into memory. On subsequent occasions, `dlopen(3)` or `uv_dlopen()` will short-circuit, returning a reference to an already loaded addon, and the function will not run. Thus, subsequent attempts to load the addon fail.

The solution to this problem was introduced in [3828fc62][]. In addition to relying on a DSO constructor, as a fallback Node.js now looks for a well-known symbol exported by the module: `node_register_module_v<number>`, where `<number>` is an integer representing the version of the addon. It only does so if the DSO constructor fails to run. The well-known symbols is the address of the module initialization function that is also stored in `node::node_module::nm_context_register_func`.

Although originally this change was made with the intention of allowing well-known symbols for multiple versions of Node.js to co-habitate within the same binary, it also enables multiple loading. Nevertheless, the ability to load a native addon multiple times means that the addon must adhere to a [context-aware addon][] structure.

### 5. Thread Safety
Since JavaScript modules are self-contained, even given their own scope at module load time by Node.js, they raise no thread safety concerns. In contrast, native addons must avoid global state in order to be considered thread-safe. This requires an explicit design decision on the part of the maintainer. Fortunately, per-addon-instance data can be heap-allocated at module initialization time, and passed to each native binding made available from the addon as seen in the example of the [context-aware addon][]. This applies to both N-API addons and V8 addons.


## Conclusion
Although the need for rendering a native addon as multiple binaries, one for each platform and architecture it supports, cannot be eliminated, with recent Node.js improvements, we can consider native addons as having taken a significant step towards being "on-par" with JavaScript modules:

|  |  | JavaScript modules | Native addons then | Native addons now |
|--- |--- |--- |--- |--- |
| 1. | ... need to be compiled. | No | Not if there are pre-builds | Not if there are pre-builds |
| 2. | ... will work on all platforms and architectures. | Yes | Yes if there are pre-builds | Yes if there are pre-builds |
| 3. | ... will work with all current and subsequent Node.js versions once written. | Yes | No | Yes if using N-API |
| 4. | ... can be loaded multiple times. | Yes | No | Yes if written as a [context-aware addon][] |
| 5. | ... are thread-safe if not explicitly making use of threading infrastructure. | Yes | No | Yes if written as a [context-aware addon][] |

The picture that emerges for native addon maintainers is that they now have the tools to provide application maintainers with native addon packages that
* need not be re-published by addon maintainers whenever a new version of Node.js is released, and that
* need not be re-installed by application maintainers solely because they wish to drop a new version of Node.js into their production invironment, and that
* can be used safely in a multi-threaded JavaScript execution environment.

It takes an effort on the part of native addon maintainers to make use of these new tools, however, the payoff is that as a result of such an effort they will not have to re-publish their packages in response to a new Node.js release. For application maintainers the availability of packages that take advantage of these new tools means that, as soon as all their dependencies are satisfied by native addons that are enabled using these tools, they too can avoid a rebuild/redeploy in response to new Node.js releases.

An [effort][] is currently underway to move the native addon ecosystem to such "on-par" packages. Please consider [joining][] our effort!

[node-pre-gyp]: https://github.com/mapbox/node-pre-gyp
[prebuild]: https://github.com/prebuild/prebuild
[`vm`]: https://nodejs.org/api/vm.html
[`process.dlopen()`]: https://docs.nodejs.org/api/process.html#process_process_dlopen_module_filename_flags
[`dlopen(3)`]: https://linux.die.net/man/3/dlopen
[`uv_dlopen()`]: http://docs.libuv.org/en/v1.x/dll.html#c.uv_dlopen
[N-API]: https://docs.nodejs.org/api/n-api.html
[89783a63]: https://github.com/nodejs/node/commit/89783a632b00270d6b72b5c5bdd6437d
[context-aware addon]: https://docs.nodejs.org/api/addons.html#addons_context_aware_addons
[effort]: https://github.com/nodejs/abi-stable-node/issues/346
[joining]: https://github.com/nodejs/abi-stable-node/
