Tinder++
========

It's a node-webkit app.

You'll need to run `npm install` in both the main directory, and inside of desktop-app before starting.

To compile your changes and test:

First, download node-webkit: https://github.com/rogerwang/node-webkit

```
cd desktop-app
zip -r tinder.nw *
/path/to/your/node-webkit tinder.nw
```

Note: if you don't have Wine installed and want to run the build script (`node build.js`), just delete the `winIco` field from build.js

### ISC License ###

Copyright (c) 2015, VibraMedia, LLC

Permission to use, copy, modify, and/or distribute this software for any purpose with or without fee is hereby granted, provided that the above copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
