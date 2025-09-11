npm run build:rpglitch
PS C:\Users\johng\Documents\GitHub\default> npm run build:rpglitch   

> joodug@1.0.6 build:rpglitch
> node build/scripts/build-rpglitch.js

🔨 Building RPGlitch…
▲ [WARNING] Import "router" will always be undefined because the file "apps/rpglitch/js/profile-router.js" has no exports [import-is-undefined]

    apps/rpglitch/js/profile.js:14:2:
      14 │   router
         ╵   ~~~~~~

X [ERROR] No matching export in "apps/rpglitch/js/index.js" for import "copyEntity"

    apps/rpglitch/js/profile.js:17:2:
      17 │   copyEntity
         ╵   ~~~~~~~~~~

X [ERROR] No matching export in "apps/rpglitch/js/utils.js" for import "sanitizeStr"

    apps/rpglitch/js/entity-form.js:10:2:
      10 │   sanitizeStr
         ╵   ~~~~~~~~~~~

▲ [WARNING] Import "router" will always be undefined because the file "apps/rpglitch/js/profile-router.js" has no exports [import-is-undefined]

    apps/rpglitch/js/entity-form.js:13:2:
      13 │   router
         ╵   ~~~~~~

❌ esbuild bundling failed: Error: Build failed with 2 errors:
apps/rpglitch/js/entity-form.js:10:2: ERROR: No matching export in "apps/rpglitch/js/utils.js" for import "sanitizeStr"
apps/rpglitch/js/profile.js:17:2: ERROR: No matching export in "apps/rpglitch/js/index.js" for import "copyEntity"
    at failureErrorWithLog (C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:1467:15)
    at C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:926:25
    at C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:878:52
    at buildResponseToResult (C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:924:7)
    at C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:951:16
    at responseCallbacks.<computed> (C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:603:9)
    at handleIncomingPacket (C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:658:12)
    at Socket.readFromStdout (C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:581:7)
    at Socket.emit (node:events:518:28)
    at addChunk (node:internal/streams/readable:561:12) {
  errors: [Getter/Setter],
  warnings: [Getter/Setter]
}
❌ Build script failed: Error: Build failed with 2 errors:
apps/rpglitch/js/entity-form.js:10:2: ERROR: No matching export in "apps/rpglitch/js/utils.js" for import "sanitizeStr"
apps/rpglitch/js/profile.js:17:2: ERROR: No matching export in "apps/rpglitch/js/index.js" for import "copyEntity"
    at failureErrorWithLog (C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:1467:15)
    at C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:926:25
    at C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:878:52
    at buildResponseToResult (C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:924:7)
    at C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:951:16
    at responseCallbacks.<computed> (C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:603:9)
    at handleIncomingPacket (C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:658:12)
    at Socket.readFromStdout (C:\Users\johng\Documents\GitHub\default\node_modules\esbuild\lib\main.js:581:7)
    at Socket.emit (node:events:518:28)
    at addChunk (node:internal/streams/readable:561:12) {
  errors: [Getter/Setter],
  warnings: [Getter/Setter]
}
