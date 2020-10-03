# @esgettext/sample-calendar-library <!-- omit in toc -->

A sample library internationalized with esgettext.

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

## Description

The library is not meant for productive use but just demonstrates how to write,
build, and bundle a library that is internationalized with esgettext.

It is written in TypeScript but the structure is the same for other JavaScript
flavors.

## Copyright

Copyright (C) 2020 Guido Flohr <guido.flohr@cantanea.com>, all
rights reserved.

This software is available under the terms and conditions of the
[WTFPL](http://www.wtfpl.net/about).
