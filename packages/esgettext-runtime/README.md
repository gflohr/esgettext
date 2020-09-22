# esgettext-runtime <!-- omit in toc -->

GNU gettext-alike translation runtime library.

## Table of Contents <!-- omit in toc -->

- [API Documentation](#api-documentation)
- [Internationalizing Hello World](#internationalizing-hello-world)
  - [Choosing a Textdomain](#choosing-a-textdomain)
  - [Install the Library](#install-the-library)
  - [Import the Library](#import-the-library)
  - [Prepare Your Sources](#prepare-your-sources)
  - [Translation Methods](#translation-methods)
    - [Simple Translations With `_()`](#simple-translations-with-_)
    - [Variable Interpolation With `_x()`](#variable-interpolation-with-_x)
    - [Plural Forms With `_nx()`](#plural-forms-with-_nx)
    - [Message Context With `_p()`](#message-context-with-_p)
    - [Specific Locale with `_l`](#specific-locale-with-_l)
    - [TODO: Gender-Specific Translations](#todo-gender-specific-translations)
  - [Selecting the Preferred Language with `selectLocale()`](#selecting-the-preferred-language-with-selectlocale)
- [Internationalizing a Library](#internationalizing-a-library)
- [Frequently-Asked Questions](#frequently-asked-questions)
  - [Why do Template Strings not Work?](#why-do-template-strings-not-work)
  - [What Does the Error "template literals with embedded expressions are not allowed as arguments to gettext functions because they are not constant" Mean?](#what-does-the-error-template-literals-with-embedded-expressions-are-not-allowed-as-arguments-to-gettext-functions-because-they-are-not-constant-mean)
- [Copyright](#copyright)

## API Documentation

If you are already familiar with the concepts of the esgettext runtime library,
you can go straight to the [API documentation](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/globals.html).

## Internationalizing Hello World

You have written this little piece of JavaScript:

```javascript
console.log('Hello, world!');
```

What are the steps needed to internationalize it with this library?

### Choosing a Textdomain

First, you have to choose a unique identifier for your project so that the
translation catalogs will have a unique name. You are almost free
in what you are choosing but you have to keep in mind that the textdomain
will be part of a URI or filename and therefore a couple of rules apply:

- A textdomain _must not_ contain a slash ("/").
- A textdomain _should not_ contain a colon (":"), because of Windows.
- A textdomain _should not_ contain a backslash (":"), because of Windows.
- A textdomain _should not_ contain binary characters, because of common sense.

In general, you should only use lowercase characters that are valid inside
hostnames, namely "a-z", "0-9", the hyphen "-", and the dot ".".

If possible, follow this advice:

1. If your organization has a domain, use the reverse(!) domain name followed by the name of your product for example "com.example.hello"
2. Otherwise, if your project sources are publicly hosted use the reverse domain name of your hoster followed by an identifier of your project. For example, the textdomain for `https://github.com/gflohr/esgettext` would then be "com.github.gflohr.esgettext".
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
<script src="https://cdn.jsdelivr.net/npm/@esgettext/esgettext-runtime/_bundles/esgettext-runtime.min.js"></script>
<script>
	var Textdomain = esgettext.Textdomain;
	// ... your code follows.
</script>
```

If you want a specific version, you can do like this:

```html
<script src="https://cdn.jsdelivr.net/npm/@esgettext/esgettext-runtime@0.1.0/_bundles/esgettext-runtime.min.js"></script>
<script>
	var Textdomain = esgettext.Textdomain;
	// ... your code follows.
</script>
```

### Prepare Your Sources

Change your `hello.js` to read like this:

```javascript
import { Textdomain } from '@esgettext/esgettext-runtime';

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

First, you set the locale (resp. language) to the desired value. Here we
choose "fr" for French. See the section [Selecting the Preferred Language with `selectLocale()`](#selecting-the-preferred-language-with-selectlocale)
for a more flexible way to select the user's locale.

You then get an instance of a `Textdomain` object. You cannot use the regular
constructor because it is private! The argument to the
[`getInstance()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#getinstance) class
method is the textdomain you have chosen.

You then have to tell the library where to find translations for the "hello"
textdomain. You do that with the instance method
[`bindtextdomain()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#bindtextdomain) that
receives a (base) directory as its argument. The actual translation catalog
would then be searched at `/assets/locale/fr/LC_MESSAGES/hello.json` (or
`hello.mo` depending on your environment).

Don't worry that there are no translations at the moment. Failure is handled
gracefully by the library falling back to using the original, untranslated
strings. See the [docs for esgettext-tools](../esgettext-tools/README.md) for
instructions on how to create translation catalogs.

You then have to [`resolve()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#resolve) the translations. The method returns a promise,
and your actual code should be moved into the promise's `then()` method.

Now that everything is loaded you can translate all messages by replacing
`'some string'` with `gtx._('some string')`. That's it!

### Translation Methods

The method [`_()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_) is the simplest but by far not the only translation method
that esgettext has to offer.

#### Simple Translations With [`_()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_)

The method [`_()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_) has already been introduced:

```javascript
console.log(gtx._('Hello, world!'));
```

It returns the translation of its argument or just the argument if no
translation can be found.

#### Variable Interpolation With [`_x()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_x)

Imagine you want to express RGB colors in human-readable form. The esgettext
way to do that goes like this:

```javascript
console.log(gtx._x(
	'red: {r}, green: {g}, blue: {b}', {
		r: red,
		g: green,
		b: blue
	}
);
```

You use placeholders surrounded by curly braces (`{}`), and provide an object
as an additional argument where the keys are the placeholder names and the
values, the respective values to be interpolated.

Placeholder names must be valid C identifiers: They must begin with a
lower- or uppercase letter ("a" to "z", "A" to "Z") or an underscore ("\_")
followed by an arbitrary number of characters from the same set or decimal
digits ("0" to "9"). In regular espression syntax: `/^[_a-zA-Z][_a-zA-Z0-9]*$/`.

#### Plural Forms With [`_nx()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_nx)

Translating a string with plural expressions is unfortunately somewhat
convoluted:

```javascript
console.log(
	gtx._nx('One file copied', '{count} files copied.', count, {
		count: count,
	}),
);
```

Count, count, count, count.

If the variable `count` has the value 42, the above would yield in English:
"42 files copied.". If `count` had the value 1, it would yield: "One file
copied.".

The method [`_nx()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_) has this signature:

```javascript
_nx(
	(msgid: string),
	(msgidPlural: string),
	(numberOfItems: number),
	(placeholders: Object),
);
```

Many times, the placeholder name will equal the variable name, so that you see
that name once inside the plural string as the placeholder, then as the
argument `numberOfItems`, then as the key in the placeholder hash, and again
as the value for that key.

Note that there is also a method [`_n()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_n) that does the same as [`_nx()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_nx) but
without inpterpolation but it only exists for completeness and is useless for
practical purposes.

#### Message Context With [`_p()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_p)

It is sometimes possible that one English sentence can have multiple, different
meanings in another language. For example "Sun" can mean our planet's star or
the abbreviation of "Sunday". In order to allow translators to provide
accurate translations for each meaning, you can distinguish them by message
context:

```javascript
weekday = gtx._p('wday', 'Sun');
star = gtx._p('star', 'Sun');
```

The first argument is the context (a free-form string), the second is the
string to translate.

It is actually sufficient to use a context just for one of the two cases.

There are also methods [`_px()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_px), when you need placeholders or [`_npx()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_npx), when
you need placeholders and plural forms in addition to a message context.

#### Specific Locale with [`_l`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_l)

Most of the time, the locale resp. language is set just once by setting the
static property `locale`:

```javascript
Textdomain.locale = 'fr';
console.log(gtx._('Hello, world!'));
```

Alternatively, you can pass the locale with every call to a translation
method:

```javascript
console.log(gtx._l('fr', 'Hello, world!'));
```

There is not just [`_l()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_l), but actually all of the above mentioned methods have
versions with a leading `_l`, like
[`_lx()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_lx)
or as complicated as
[`_lnpx()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_lnpx).

One use-case for the
[`_l()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_l)
family of methods
would be a web server. A web server handles requests asynchronously, and a
global locale doesn't make sense. Instead, the language is typically bound
to the request or response and should be taken from there.

#### TODO: Gender-Specific Translations

This is on the todo list for a future version. You will be able to do something
like:

```javascript
msg = gtx._g(
	user.gender,
	'They have liked your photo.',
	'She has liked your photo.',
);
```

### Selecting the Preferred Language with [`selectLocale()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#selectLocale)

Negotiating the preferred locale can be performed with the help of esgettext.
If your application supports the locales "en-US", "en-GB", "fr-FR", and
"de-DE", you can select a suitable locale for the current user by calling
[`Textdomain.selectlocale`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#selectLocale)

```javascript
Textdomain.locale = Textdomain.selectLocale(['en-US', 'en-GB', 'fr-FR']);
```

[`Textdomain.selectLocale()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#selectLocale)
will return the most suitable locale for the current user. For browser code,
the browser will be queried for the user language preferences, for server
code the environment variables `LANGUAGE`, `LC_ALL`, `LANG`, and `LC_MESSAGES`
will be queried in that order.

You can also explicitly specify, which locales the user has requested by
passing a second argument:

```javascript
Textdomain.locale = Textdomain.selectLocale(
	['en-US', 'en-GB', 'fr-FR'], // Supported by the application.
	['de-DE', 'fr-FR'],
); // Requested by the user.
```

## Internationalizing a Library

Internationalizing a library is very simple. Take this sample library:

```javascript
function greet(name) {
	return `Hello, ${name}`;
}
```

Internationalized, it would look like this:

```javascript
import { Textdomain } from '@esgettext/esgettext-runtime';

const gtx = Textdomain.getInstance('hello-library');
gtx.bindtextdomain('/assets/locale');

function greet(name) {
	return gtx._x('Hello, {name}', { name: name });
}
```

The main differences to an internationalized application are:

- You do not set [Textdomain.locale](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#locale) because the main application (the application that loads your library) does it.
- You do not call [resolve()](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#resolve) because whenever the main application calls `resolve()`, the catalogs for your library will also be loaded.

## Frequently-Asked Questions

### Why do Template Strings not Work?

A common error is to use template strings with interpolations as arguments to
the translation functions, for example:

```javascript
console.log(gtx._(`red: ${red}, green: ${green}, blue: ${blue}`);
```

That seems to work for English but the string never gets translated.

The reason is that the argument to
[`_()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_)
is the lookup key into the translation database but that key has to be constant.
The method receives an argument like "red: 127, green: 63, blue: 31" because
the JavaScript engine has already interpolated the variables into the string.
But that string does not exist in the database.

You have to use
[`_x()`](https://gflohr.github.io/esgettext/packages/esgettext-runtime/api-docs/classes/textdomain.html#_x)
instead:

```javascript
console.log(gtx._x(
	'red: {r}, green: {g}, blue: {b}', {
		r: red,
		g: green,
		b: blue
	}
);
```

### What Does the Error "template literals with embedded expressions are not allowed as arguments to gettext functions because they are not constant" Mean?

See [Why do Template Strings not Work?](#why-do-template-strings-not-work)
above! The extractor `esgettext-xgettext` complains that you are using a
template string with interpolated expressions.

## Copyright

Copyright (C) 2020 Guido Flohr <guido.flohr@cantanea.com>, all
rights reserved.

This software is available under the terms and conditions of the
[WTFPL](http://www.wtfpl.net/about).
