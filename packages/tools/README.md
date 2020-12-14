# @esgettext/tools <!-- omit in toc -->

Supporting tools for https://github.com/gflohr/esgettext.

## Table of Contents <!-- omit in toc -->

- [Status](#status)
- [Prerequisites](#prerequisites)
	- [Un*x/Linux](#unxlinux)
	- [Mac OS X](#mac-os-x)
		- [MacPorts](#macports)
		- [HomeBrew](#homebrew)
	- [MS-DOS (Microsoft Windows)](#ms-dos-microsoft-windows)
- [Installation](#installation)
- [The Tools](#the-tools)
	- [`esgettext-gettextize`](#esgettext-gettextize)
	- [`esgettext-xgettext`](#esgettext-xgettext)
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

```
$ sudo yarn global add @esgettext/tools
```

But you should rather install [npx](https://www.npmjs.com/package/npx), because
then you can (es)gettextize your project like this:

```
$ npm install --save-dev @esgettext/tools
$ npx @esgettext/gettextize
```

or for yarn:

```
$ yarn add --dev @esgettext/tools
$ npx @esgettext/gettextize
```

This will modify your `package.json` with a couple of scripts, all named
`po:.*`. You can then finetune your setup by just editing `package.json`.

## The Tools

### `esgettext-gettextize`

The script `esgettext-gettextize` sets up your project for being
internationalized with esgettext.

See the detailed
[esgettext-gettextize usage information](./README-esgettext-gettextize.md)
for more details.

### `esgettext-xgettext`

The script `esgetext-xgettext` extracts translatable strings from your source
files into `.po` resp. `.pot` files.

See the detailed
[esgettext-xgettext usage information](./README-esgettext-xgettext.md)
for more details.

## Copyright

Copyright (C) 2020 Guido Flohr <guido.flohr@cantanea.com>, all
rights reserved.

This software is available under the terms and conditions of the
[WFTPL](http://www.wtfpl.net/about).
