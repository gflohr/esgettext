# @esgettext/esgettext-gettextize <!-- omit in toc -->

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
	- [esgettext-gettextize](#esgettext-gettextize)
	- [`esgettext-xgettext`](#esgettext-xgettext)
- [Copyright](#copyright)

## Description

`esgettext-gettextize` is the only tool you normally have to execute yourself, and you only
have to do it once in order to prepare your package for
internationalization (i18n). If you have installed '@esgettext/tools' globally,
you go like this:

```shell
$ esgettext-gettextize
```

If you have installed it as a development dependency only, you have to use
[npx](https://www.npmjs.com/package/npx) instead:

```shell
$ npm install --save-dev @esgettext/tools
$ npx esgettext-gettextize
```

Or for yarn:

```shell
$ yarn add --dev @esgettext/tools
$ npx esgettext-gettextize
```

## Copyright

Copyright (C) 2020 Guido Flohr <guido.flohr@cantanea.com>, all
rights reserved.

This software is available under the terms and conditions of the
[WFTPL](http://www.wtfpl.net/about).
