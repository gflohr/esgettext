# @esgettext/tools <!-- omit in toc -->

Supporting tools for https://github.com/gflohr/esgettext.

## Table of Contents <!-- omit in toc -->

- [Status](#status)
- [Prerequisites](#prerequisites)
	- [Un\*x/Linux](#unxlinux)
	- [Mac OS X](#mac-os-x)
		- [MacPorts](#macports)
		- [HomeBrew](#homebrew)
	- [MS-DOS (Microsoft Windows)](#ms-dos-microsoft-windows)
- [Installation](#installation)
- [The Tools](#the-tools)
	- [`esgettext xgettext`](#esgettext-xgettext)
	- [Other Commands](#other-commands)
- [Configuration](#configuration)
	- [Configuration Files](#configuration-files)
	- [Validation](#validation)
	- [Configuration Schema](#configuration-schema)
		- [`package`](#package)
			- [`package.textdomain`](#packagetextdomain)
			- [`package.msgid-bugs-address`](#packagemsgid-bugs-address)
			- [`package.name`](#packagename)
			- [`package.copyright-holder`](#packagecopyright-holder)
			- [`package.version`](#packageversion)
		- [`po`:](#po)
			- [`po.directory`](#podirectory)
			- [`po.locales`](#polocales)
		- [`install`](#install)
			- [`install.directory`](#installdirectory)
		- [`programs`](#programs)
			- [`programs.msgmerge`](#programsmsgmerge)
				- [`programs.msgmerge.path`](#programsmsgmergepath)
				- [`programs.msgmerge.options`](#programsmsgmergeoptions)
			- [`programs.msgfmt`](#programsmsgfmt)
				- [`programs.msgfmt.path`](#programsmsgfmtpath)
				- [`programs.msgfmt.options`](#programsmsgfmtoptions)
- [Copyright](#copyright)

## Status

in development.

## Prerequisites

Most of the esgettext tools depend at least indirectly on the GNU gettext
tools. If the command `xgettext --version` outputs some kind of version
information, you are most probably set. Otherwise check the information for
your platform below.

### Un*x/Linux

Use the package manager of your vendor to search for something like
"gettext-tools" or just "gettext" and install it. The gettext tools are
available for every Unix or Linux flavor.

### Mac OS X

You either need [MacPorts](https://www.macports.org/)
or [HomeBrew](https://brew.sh/).

#### MacPorts

```shell
$ sudo port install gettext
```

#### HomeBrew

```shell
$ brew install gettext
```

### MS-DOS (Microsoft Windows)

The options that I know of are

* [Cygwin](https://www.cygwin.com/)
* [MinGW](http://www.mingw.org/)

See their documentation for more information.

If you have better information, please
[file an issue](https://github.com/gflohr/esgettext/issues) or improve the
documentation with a [pull request](https://github.com/gflohr/esgettext).

## Installation

You don't have to install the esgettext tools globally but if you are lazy,
just do it. For [npm](https://www.npmjs.com/) you go with:

```shell
$ sudo npm install --global @esgettext/tools
```

For [Yarn](https://yarnpkg.com/), you would do this:

```shell
$ sudo yarn global add @esgettext/tools
```

Normally, it is better to install them just locally:

```shell
$ npm install --save-dev @esgettext/tools
```

or for yarn:

```shell
$ yarn add --dev @esgettext/tools
```

## The Tools

The tools are really just one tool `esgettext` that supports several
commands.

In the following, it is assumed that you have installed the tools locally.
If you have installed them globally, just omit the leading `npx`.

Try this for an overview:

```shell
$ npx esgettext --help
```

### `esgettext xgettext`

The command `npx esgetext xgettext` extracts translatable strings from your source
files into `.po` resp. `.pot` files.

You can use `npx esgettext extract` as an alias for `npx esgettext xgettext`.

See the detailed
[esgettext-xgettext usage information](./README-esgettext-xgettext.md)
for more details.

### Other Commands

All other commands should be understandable by their help output.  Try
`npx esgettext --help` for an overview over all commands, and
`npx esgettext COMMAND --help` for help for a specific command.

## Configuration

Instead of passing options on the command line, you can add a lot of defaults
in a configuration file or just in `package.json`.

### Configuration Files

Configuration files are checked in this order:

* esgettext.config.mjs
* esgettext.config.cjs
* esgettext.config.js
* esgettext.config.json
* package.json

The JavaScript versions should have one default export with the configuration.
The JSON version just defines the configuration. Alteratively, you can add
a field "esgettext" to your `package.json`.

You should always configure `po.locales` with a list of locale identifiers that
your package supports.  Otherwise, using `esgettext` does not make sense.

You should also set `package.textdomain` unless you are happy with the
default which is just your package name read from `package.json`.

All other configuration values have sane defaults.

### Validation

The required format is always the same.  Note that the configuration gets
validated against a schema.  All tools will fail with a validation error if
you pass an invalid configuration.

### Configuration Schema

All fields in the configuration are optional because you are always able to
pass them on the command line.

Options passed on the command line have higher precedence than options given
in a configuration file.  Options that you define inside a section `esgettext`
in `package.json` have higher precedence than options that default to
general fields inside `package.json`.

A complete example for a configuration can look like this:

```javascript
package: {
	textdomain: 'com.example.my-package',
	'msgid-bugs-address': 'you@example.com',
	name: 'my-package',
	'copyright-holder': 'Yours Truly <you@example.com>',
},
po: {
	directory: 'po',
	locales: ['de', 'fr-CA', 'fr-FR', 'it'],
}
```

#### `package`

General information about your package.

##### `package.textdomain`

The textdomain of your package, usually something like
`com.example.YOUR-PACKAGE`.  You should configure this.

##### `package.msgid-bugs-address`

An email address or URL where to send bug reports or questions about message
ids.  This is added to the respective field in all generated po files.

If you omit this field, it will be read from the fields `bugs.email` or
`bugs.url` (in that order) in `package.json`.

##### `package.name`

The name of your package.

If you omit this field, it will be read from the field `name` in
`package.json`.

##### `package.copyright-holder`

The copyright holder of your package.  This is added as a comment to all
generated po files.

If you omit this field, it will be read from the field `people.author` in
`package.json`.


##### `package.version`

The version of your package.

If you omit this field, it will be read from the field `version` in
`package.json`.

#### `po`:

The location of your translation and translation workflow files and feature
thereof.

##### `po.directory`

The directory where all translation related files reside, usually 'po'.

##### `po.locales`

An array of locale identifiers.  This should always be configured.

#### `install`

Installation options.

##### `install.directory`

Where to install compiled translation files, usually something like
`src/locale`, `assets/locale`, or `dist/assets/locale`.

#### `programs`

Information for helper programs.

##### `programs.msgmerge`

###### `programs.msgmerge.path`

The path to the `msgmerge` program of your system.

###### `programs.msgmerge.options`

An array of options to pass to the `msgmerge` program.  Only boolean options
without arguments are supported.  And you have to omit the leading hyphens,
for example `['verbose']` or `['v']`, and not `['--verbose']` or `['-v']`.

##### `programs.msgfmt`

###### `programs.msgfmt.path`

The path to the `msgfmt` program of your system.

###### `programs.msgfmt.options`

An array of options to pass to the `msgmerge` program.  Only boolean options
without arguments are supported.  And you have to omit the leading hyphens,
for example `['verbose']` or `['v']`, and not `['--verbose']` or `['-v']`.

## Copyright

Copyright (C) 2020-2024 Guido Flohr <guido.flohr@cantanea.com>, all
rights reserved.

This software is available under the terms and conditions of the
[WFTPL](http://www.wtfpl.net/about).
