# esgettext-runtime

GNU gettext-alike translation runtime library.

## Status

in development.

## Documentation

Preliminary, minimal documentation:

```typescript
import Textdomain from '@esgettext/runtime';

// Set the locale only in the main source file.
Textdomain.locale = 'fr-FR';

// Get an instance for your textdomain "mypackage".
const gtx = Textdomain.getInstance('mypackage');

// Bind it to a directory. There should exist a file
// /assets/locale/fr-FR/LC_MESSAGES/mypackage.json
// This has to be done only in the main file.
gtx.bindtextdomain('/assets/locale');

// And only in the main file asynchronously load a catalog.
await gtx.resolve();

// And now translate strings.
console.log(gtx._('Hello, world!'));
console.log(gtx,_('Hello, {name}!', { name: 'world' }));
console.log(gtx._n('Fix the error!', 'Fix the errors!', numErrors));
console.log(gtx._nx('One request', '{num} requests', numRequests, {
	num: numRequests,
}))

console.log(gtx._('Open'));
console.log(gtx._p('Menu->File', 'Open'));

console.log(gtx._npx('Context', 'One request', '{num} requests', numRequests, {
	num: numRequests
});
```

## Copyright

Copyright (C) 2020 Guido Flohr <guido.flohr@cantanea.com>, all
rights reserved.

This software is available under the terms and conditions of the
[WTFPL](http://www.wtfpl.net/about).
