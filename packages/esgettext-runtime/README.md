# esgettext-runtime <!-- omit in toc -->

GNU gettext-alike translation runtime library.

## Table of Contents <!-- omit in toc -->

- [API Documentation](#api-documentation)
- [Internationalizing Hello World](#internationalizing-hello-world)
  - [Choosing a Textdomain](#choosing-a-textdomain)
  - [Install the Library](#install-the-library)
  - [Import the Library](#import-the-library)
  - [Prepare Your Sources](#prepare-your-sources)
- [Copyright](#copyright)

## API Documentation

If you are already familiar with the concepts of the esgettext runtime library,
you can go straight to the [API documentation](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/globals.html). <!-- host the bundle on jsdelivr? -->

## Internationalizing Hello World

You have written this little piece of JavaScript:

```javascript
console.log('Hello, world!');
```

### Choosing a Textdomain

First, you have to choose a unique identifier for your project so that the
translation catalogs will have a unique name. You are almost completely free
in what you are choosing but you have to keep in mind that the textdomain
will be part of a URI or filename and therefore a couple of rules apply:

- A textdomain _must not_ contain a slash ("/").
- A textdomain _should not_ contain a colon (":"), because of Windows.
- A textdomain _should not_ contain a backslash (":"), because of Windows.
- A textdomain _should not_ contain binary characters.

In general, you should only use lowercase characters that are valid inside
hostnames, namely "a-z", "0-9", the hyphen ".", and the dot ".".

If possible follow this advice.

1. If your organization has a domain, use the reverse(!) name of the domain followed by the name of your product for example "com.example.hello"
2. Otherwise, if your project sources are publicly hosted use the reserve domain name of your hoster followed by an identifier of your project. For example, the textdomain for `https://github.com/gflohr/esgettext` would then be "com.github.gflohr.esgettext".
3. Otherwise, use common sense.

We will use the the third rule and pick the textdomain "hello".

### Install the Library

You normally install the library with `npm` or `yarn`.

With `npm`:

```shell
$ npm install --save esgettext
```

Or with `yarn`:

```shell
$ yarn add esgettext
```

### Import the Library

How to import the library, depends on your environment.

If you have the `import` keyword:

```javascript
import Textdomain from '@esgettext/esgettext-runtime';
```

If you can use `require`:

```javascript
const esgettext = require('@esgettext/esgettext-runtime');
const Textdomain = esgettext.Textdomain;
```

_FIXME! Is this correct?_

If you are writing javascript loaded by a browser:

```html
<script src="esgettext-runtime.min.js"></script>
<script>
	var Textdomain = esgettext.Textdomain;
	// ... your code follows.
</script>
```

If you are not using `npm` or `yarn` for getting the library, you can download
a tar ball from https://github.com/gflohr/esgettext/releases. You will find
the file `esgettext-runtime.min.js` at `packages/esgettext-runtime/_bundles`.

_FIXME! This is currently not true._

### Prepare Your Sources

Change your `hello.js` to read like this:

```javascript
import Textdomain from '@esgettext/esgettext-runtime';

Textdomain.locale = 'fr';
const gtx = Textdomain.getInstance('hello');
gtx.bindtextdomain('/assets/locale');
gtx.resolve().then(function () {
	console.log(gtx._('Hello, world!'));
});
```

_Hint:_ If you cannot use `import`, use one of the other techniques shown
above to make the `Textdomain` class available in your source!

What is happening here?

First you set the locale (resp. language) to the desired value. Here we
choose "fr" for French.

_FIXME! There should be a static method for selecting a language/locale!_

You then get an instance of a `Textdomain` object. You cannot use the regular
constructor because it is private! The argument to the `getInstance` class
method is the textdomain you have chosen.

You then have to tell the library where to find translations for the "hello"
textdomain. You do that with the instance method `bindtextdomain()` that
receives a (base) directory as its argument. The actual translation catalog
would then be searched at `/assets/locale/fr/LC_MESSAGES/hello.json` (or
`hello.mo` depending on your environment).

Don't worry that there are no translations at the moment. Failure is handled
gracefully by the library by falling back to using the original, untranslated
strings. See the [docs for esgettext-tools](../esgettext-tools/README.md) for
instructions how to create translation catalogs.

You then have to `resolve()` the translations. The method returns a promise,
and your actual code should be moved into the promise's `then()` method.

Now that everything is loaded you can translate all messages by replacing
`'some string'` with `gtx._('some string')`. That's it!

_To be continued ..._

## Copyright

Copyright (C) 2020 Guido Flohr <guido.flohr@cantanea.com>, all
rights reserved.

This software is available under the terms and conditions of the
[WTFPL](http://www.wtfpl.net/about).
