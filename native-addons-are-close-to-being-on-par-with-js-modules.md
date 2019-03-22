# New Features Bring Native Add-ons Close To Being On Par With JS Modules

Node.js provides a wide variety of extremely useful APIs for accomplishing the work of an application via its built-in modules such as `fs`, `http`, `net`, and many others. All these modules execute native code when called from JavaScript. This is how they provide their functionality. The native C/C++ code for these modules is compiled into and shipped with Node.js.

Yet Node.js alone cannot cover all features of an underlying system which JavaScript application programmers might want to make use of. To this end it has, since very early versions, provided an opportunity for developers familiar with writing native code to contribute functionality written in native code in external packages, and to expose a JavaScript interface that allows JS application developers to take advantage of this functionality.

These native add-ons are available via npm, just like pure JavaScript packages. Examples include [serialport][], [farmhash][], [gRPC][], and many others. Many applications depend on such native add-ons, often indirectly, as a result of their direct dependencies in turn depending on them.

OK, so native add-ons have been a part of Node.js since the very beginning. So have JS modules 😉 So, what does it mean that they are now close to being "on-par"? Why only now?

The reason is that native add-ons have entailed a maintenance overhead that JS modules never have. Such overhead places an additional burden on native add-on developers as well as those application maintainers whose applications depend on native add-ons. Additionally, native add-ons were lacking certain fundamental capabilities that JS modules have always had. Nevertheless, recent versions of Node.js have introduced features that remove many of the additional maintenance burdens that native add-on maintainers have so far experienced compared to maintainers of JavaScript-only packages.

Let's first look at the similarities between native add-ons and JS modules. Both can be `require()`-ed:

```JS
// A JS module can be loaded from a package:
const jsModulePackage = require('my-js-module');
// It can also be loaded from a specific file:
const jsModuleFile = require('./my-js-module.js');

// A native add-on can also be loaded from a file:
const nativeAddonFile = require('./build/Release/my-native-add-on.node');
```

Both return a JavaScript object containing useful functionality which would otherwise be completely unavailable, or which would otherwise take a long time to implement.

Nevertheless, the similarities end there. Let's now highlight some constraints and requirements unique to native add-ons, in order to better understand the above-mentioned maintenance burden, and the recently achieved progress towards alleviating it. Subsequently, we elaborate on each constraint/requirement and the steps taken to lessen its impact on the maintenance of native add-ons.

| | | JavaScript modules | Native add-ons |
|--- |--- |--- |--- |
| 1. | ... need to be compiled. | No | Not if there are pre-builds |
| 2. | ... will work on all platforms and architectures. | Yes | Yes if there are pre-builds |
| 3. | ... are designed to work with all current and subsequent Node.js versions once written. | Yes | No |
| 4. | ... can be loaded multiple times. | Yes | No |
| 5. | ... are thread-safe if not explicitly making use of threading infrastructure. | Yes | No |
| 6. | ... can be unloaded. | Yes | No |

### 1. Compilation
This will always be a fundamental difference between JavaScript modules and native add-ons. The process whereby source code written in C or C++ (or even a different language such as Rust or Go) gets bundled into a native add-on will always be an extra step in addition to publishing an npm package which users can consume. In fact, if the maintainer does not take the time to provide pre-built packages by using tools such as [node-pre-gyp][], [prebuildify][], or [prebuild][], then those who would depend on the native add-on have to install a compiler and build tool chain to allow the native add-on package to build on their system before they are able to run their application. Nevertheless, npm packages providing pre-built native add-ons can make it appear as though a native add-on can be installed as easily as a JavaScript module.

### 2. Platform And Architecture Independence
A single `.js` file defines a single JavaScript module because fundamentally it is nothing more than plain text which is read in from the file system by Node.js and then interpreted. In contrast, a native addon is a binary containing machine code. Thus, a single binary can only serve a specific type of machine running a specific type of operating system. For example, a single binary can only serve Windows running on x86 (Intel or AMD). A different binary is needed for OSX on x86, and yet another one is needed for Linux on x86 and so on. Add-on maintainers' tools such as node-pre-gyp and prebuild can bridge this gap as well. They make it possible for maintainers to produce a binary for each platform/architecture/Node.js version combination they wish to support so that at package installation time, the npm install script can choose the appropriate binary, download it, and give it to Node.js for loading and execution.

### 3. Node.js Version Independence
JavaScript modules, once written, will work on the version of Node.js for which they were written, and will also work without re-installation *on all subsequent versions of Node.js*. Errors can only arise if the JavaScript APIs used by the module are changed in an incompatible, "breaking" fashion. This can happen, but the Node.js team is committed to maintaining the stability of all JavaScript interfaces. Breaking changes are introduced only when there are compelling reasons for doing so, and when no alternative solution is deemed adequate.

In contrast, native add-ons are tied to the version of Node.js for which they were written. For a given platform and architecture, a different binary has to be provided for version 8.x of Node.js than for version 10.x. The reason for this is that the native API provided by Node.js to native add-on developers changes from one major version to the next in such a way that the native add-on will no longer load, or in the worst case, will load but crash seemingly inexplicably. To save many hours of hunting down seemingly inexplicable crashes, a simple versioning scheme based on a single integer value was added, whereby the Node.js version against which an add-on was built is recorded within the add-on at compile time and examined upon loading the add-on. If the value does not match the value carried by Node.js, it will fail to load the add-on, producing a message familiar to many:

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

Such errors can also be avoided by the use of prebuild utilities because they allow add-on maintainers to distribute binaries for each Node.js version they wish to support. However, it places even more burden on add-on maintainers, namely, to rebuild the binaries they provide at every release of Node.js. It also increases the number of binaries they need to maintain to support the large number of architecture/platform/version combinations. Additionally, it prevents application maintainers from simply dropping a new version of Node.js into their production environment. Indeed they need to reinstall their application even though no part of its functionality has changed.

[N-API][] was introduced to address the problem of the binary compatibility of native add-ons with versions of Node.js against which they were built *as well as all subsequent versions*. This binary compatibility means not only that the source code need not be touched in order to build against later Node.js version, but also that the binaries built against an earlier version of Node.js will continue to link to and work correctly with all later versions of Node.js. Its ultimate aim is to eliminate [issues][] related to add-ons breaking when a new version of Node.js is released.

N-API abstracts away essential JavaScript engine and Node.js APIs, presenting them to native add-on maintainers as a collection of ABI-stable APIs. The stability of N-API stems from the fact that all APIs are C APIs rather than C++ APIs and from a commitment on the part of the Node.js core developer community to avoid modifying the interface in an incompatible way.

N-API eliminates one of the three variables that causes the proliferation of binaries required to provide a single Node.js native add-on: the integer value that represents the Node.js version against which the binary is designed to work (`NODE_MODULE_VERSION`).

Since N-API provides a JavaScript engine-independent interface to the language features, its availability makes it possible to drop other JavaScript engines into Node.js. The [node-chakracore][] project is an example of a Node.js version with a different JavaScript engine "under the hood".

N-API can also serve as an interface to the JavaScript engine outside of Node.js. The [ShadowNode][] project is in the process of implementing N-API using the [JerryScript][] JavaScript engine as its back end. Such efforts make it possible to provide native add-ons for a variety of environments such as constrained IoT devices using a single code base.

### 4. Multiple Loading
The advent of worker threads in Node.js, and even earlier modules such as [`vm`][], make it possible to load modules multiple times. This is easy to do with JavaScript modules because Node.js simply re-reads and re-interprets the file defining the JavaScript module and the resulting object resides in a separate context, without inadvertently sharing any state with its previously loaded incarnation. In contrast, it has only recently become possible to load native add-ons more than once. The reason for this is architectural. In particular, it is because the mechanism for loading a native add-on was as follows:

0. Node.js calculates the absolute path to the native add-on.
0. Node.js calls the method [`process.dlopen()`][], passing in the absolute path previously calculated.
0. On the native side, Node.js calls [`dlopen(3)`][] or [`uv_dlopen()`][] on Windows.
0. The add-on is loaded and it executes a so-called DSO constructor function as part of the loading process. The function passes a pointer to a structure of type `node::nm_module` to Node.js.
0. The `node::node_module::nm_register_func` or `node::node_module::nm_context_register_func` member of the structure holds a pointer to a function which is responsible for populating the object which will become the result of having loaded the module (`module.exports`).

The problem with DSO constructor functions is that they only run the first time an add-on is loaded into memory. On subsequent occasions, `dlopen(3)` or `uv_dlopen()` will short-circuit, returning a reference to an already loaded add-on, and the function will not run. Thus, subsequent attempts to load the add-on fail.

The solution to this problem was introduced in [3828fc62][]. In addition to relying on a DSO constructor, as a fallback Node.js now looks for a well-known symbol exported by the module: `node_register_module_v<number>`, where `<number>` is an integer representing the version of the add-on. It only does so if the DSO constructor fails to run. The well-known symbols is the address of the module initialization function that is also stored in `node::node_module::nm_context_register_func`.

Although originally this change was made with the intention of allowing well-known symbols for multiple versions of Node.js to co-habitate within the same binary, it also enables multiple loading. Nevertheless, the ability to load a native add-on multiple times means that the add-on must adhere to a [context-aware add-on][] structure.

N-API modules can also be loaded multiple times. They have their own, Node.js-version-independent well-known symbol which Node.js attempts to retrieve as a backup.

### 5. Thread Safety
Since JavaScript modules are self-contained, even given their own scope at module load time by Node.js, they raise no thread safety concerns. In contrast, native add-ons must avoid global state in order to be considered thread-safe. This requires an explicit design decision on the part of the maintainer. Fortunately, per-add-on-instance data can be heap-allocated at module initialization time, and passed to each native binding made available from the add-on as seen in the example of the [context-aware add-on][]. This applies to both N-API add-ons and V8 add-ons.

### 6. Module Unloading
When a worker thread finishes, all JavaScript modules that were loaded during its life cycle are simply discarded. In contrast, unloading native add-ons is quite risky if done improperly, because the bindings they expose to JavaScript point back into areas of memory occupied by the add-on. If the add-on is unloaded before the environment properly cleans up, it is possible that Node.js will attempt to execute bindings which are no longer loaded. This will result in a crash.

To remove this obstacle, [cleanup hooks][] were added which allow a native add-on to safely clean up resources it uses knowing that the environment is in the process of being torn down in a controlled fashion.

## Conclusion
Although the need for rendering a native add-on as multiple binaries, one for each platform and architecture it supports, cannot be eliminated, with recent Node.js improvements, we can consider native add-ons as having taken a significant step towards being "on-par" with JavaScript modules:

| | | JavaScript modules | Native add-ons then | Native add-ons now |
|--- |--- |--- |--- |--- |
| 1. | ... need to be compiled. | No | Not if there are pre-builds | Not if there are pre-builds |
| 2. | ... will work on all platforms and architectures. | Yes | Yes if there are pre-builds | Yes if there are pre-builds |
| 3. | ... are designed to work with all current and subsequent Node.js versions once written. | Yes | No | Yes if using N-API |
| 4. | ... can be loaded multiple times. | Yes | No | Yes if written as a [context-aware add-on][] |
| 5. | ... are thread-safe if not explicitly making use of threading infrastructure. | Yes | No | Yes if written as a [context-aware add-on][] |
| 6. | ... can be unloaded. | Yes | No | Yes if written as a [context-aware add-on][] and using [cleanup hooks][] |

The picture that emerges for native add-on maintainers is that they now have the tools to provide application maintainers with native add-on packages that
* need not be re-published whenever a new version of Node.js is released, and that
* need not be re-installed by application maintainers solely because they wish to drop a new version of Node.js into their production invironment, and that
* can be used safely in a multi-threaded JavaScript execution environment.

It takes an effort on the part of native add-on maintainers to make use of these new tools, however, the payoff is that as a result of such an effort they will not have to re-publish their packages in response to a new Node.js release. For application maintainers, the availability of packages that take advantage of these new tools means that as soon as all their dependencies are satisfied by native add-ons that are enabled using these tools, they too can avoid a rebuild/redeploy in response to new Node.js releases.

An [effort][] is currently underway to move the native add-on ecosystem to such "on-par" packages. Please consider [joining][] our effort!

Thank you all who [contributed][] to this text!

[node-pre-gyp]: https://github.com/mapbox/node-pre-gyp
[prebuild]: https://github.com/prebuild/prebuild
[`vm`]: https://nodejs.org/api/vm.html
[`process.dlopen()`]: https://docs.nodejs.org/api/process.html#process_process_dlopen_module_filename_flags
[`dlopen(3)`]: https://linux.die.net/man/3/dlopen
[`uv_dlopen()`]: http://docs.libuv.org/en/v1.x/dll.html#c.uv_dlopen
[N-API]: https://docs.nodejs.org/api/n-api.html
[89783a63]: https://github.com/nodejs/node/commit/89783a632b00270d6b72b5c5bdd6437d
[context-aware add-on]: https://docs.nodejs.org/api/addons.html#addons_context_aware_addons
[effort]: https://github.com/nodejs/abi-stable-node/issues/346
[joining]: https://github.com/nodejs/abi-stable-node/
[node-chakracore]: https://github.com/nodejs/node-chakracore
[ShadowNode]: https://github.com/yodaos-project/ShadowNode
[JerryScript]: http://jerryscript.net/
[issues]: https://github.com/nodejs/abi-stable-node/issues/346
[3828fc62]: https://github.com/nodejs/node/commit/3828fc62
[contributed]: https://github.com/gabrielschulhof/gabrielschulhof.github.com/pull/1
[serialport]: https://www.npmjs.com/package/serialport
[farmhash]: https://www.npmjs.com/package/farmhash
[gRPC]: https://www.npmjs.com/package/grpc
[cleanup hooks]: https://nodejs.org/docs/latest/api/addons.html#addons_worker_support
[prebuildify]: https://github.com/prebuild/prebuildify
