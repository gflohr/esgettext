# @esgettext/esgettext-xgettext <!-- omit in toc -->

Extract translatable strings from given input files

## Table of Contents <!-- omit in toc -->

- [Invocation](#invocation)
	- [Input File Location](#input-file-location)
		- [`-f, --files-from=FILE`](#-f---files-fromfile)
		- [`-D, --directory=DIRECTORY`](#-d---directorydirectory)
	- [Output File Location](#output-file-location)
		- [`-d, --default-domain=NAME`](#-d---default-domainname)
		- [`-o, --output=FILE`](#-o---outputfile)
		- [`-p, --output-dir=DIR`](#-p---output-dirdir)
	- [Choice of Input File Language](#choice-of-input-file-language)
		- [`-L, --language=LANGUAGE`](#-l---languagelanguage)
	- [Interpretation of Input Files](#interpretation-of-input-files)
		- [`--from-code=NAME`](#--from-codename)
	- [Operation Mode](#operation-mode)
		- [`-j, --join-existing`](#-j---join-existing)
		- [`-x, --exclude-file=FILE.po`](#-x---exclude-filefilepo)
		- [`-c, --add-comments=TAG`](#-c---add-commentstag)
		- [`--add-all-comments`](#--add-all-comments)
	- [Language-Specific Options](#language-specific-options)
		- [`-a, --extract-all`](#-a---extract-all)
		- [`-k, --keyword=WORD`](#-k---keywordword)
		- [`--flag=WORD:ARG:FLAG`](#--flagwordargflag)
		- [`--instance=WORD`](#--instanceword)
	- [Output Details](#output-details)
		- [`--force-po`](#--force-po)
		- [`-w, --width=WIDTH`](#-w---widthwidth)
		- [`--no-wrap`](#--no-wrap)
		- [`-s, --sort-output`](#-s---sort-output)
		- [`-F, --sort-by-file`](#-f---sort-by-file)
		- [`--omit-header`](#--omit-header)
		- [`--package-json=FILENAME`](#--package-jsonfilename)
		- [`--copyright-holder`](#--copyright-holder)
		- [`--foreign-user`](#--foreign-user)
		- [`--package-name`](#--package-name)
		- [`--package-version`](#--package-version)
		- [`--msgid-bugs-address`](#--msgid-bugs-address)
		- [`-m[STRING], --msgstr-prefix[=STRING]`](#-mstring---msgstr-prefixstring)
		- [`-m[STRING], --msgstr-suffix[=STRING]`](#-mstring---msgstr-suffixstring)
	- [Informative Output](#informative-output)
		- [`--help`](#--help)
		- [`--version`](#--version)
		- [`--verbose`](#--verbose)
- [Copyright](#copyright)

## Invocation

Usage:

```shell
esgettext-xgettext [OPTIONS] [INPUTFILE]...
```

The script `esgettext-xgettext` extracts strings from your JavaScript/TypeScript
and HTML (todo!) sources. Its command-line interface is mostly compatible
with [`xgettext` from GNU
gettext](https://www.gnu.org/software/gettext/manual/html_node/xgettext-Invocation.html).

All non-option command-line arguments are treated as input source files to
scan for translatable messages. But in general you will use the option
`--files-from` to pass the list of input source files.

### Input File Location

#### `-f, --files-from=FILE`

Get the list of input files from `FILE`.

By convention, this file is called `POTFILES`.

If an input file is `-`, standard input is read.

#### `-D, --directory=DIRECTORY`

Add `DIRECTORY` to the list of directories to search for input files.

You can also specify this as `esgettext.directory` in `package.json` with
the option [`--package-json`](#--package-jsonfilename).

### Output File Location

#### `-d, --default-domain=NAME`

Use `NAME.po` as output (instead of `messages.po`).

You can also specify this as `esgettext.textdomain` in `package.json` with
the option [`--package-json`](#--package-jsonfilename).

#### `-o, --output=FILE`

Write output to the specified file. If the output file is `-`, output is
written to standard output.

The value will be intelligently guessed from your `package.json` with
the option [`--package-json`](#--package-jsonfilename).

#### `-p, --output-dir=DIR`

Place output files in the specified directory.

### Choice of Input File Language

#### `-L, --language=LANGUAGE`

Assume the specified language (JavaScript, TypeScript, HTML). TODO! HTML is not
yet supported.

By default, the language is guessed depending on the input file name extension.

### Interpretation of Input Files

#### `--from-code=NAME`

Assume `NAME` as the encoding of input files.

By default the input files are assumed to be in ASCII.

### Operation Mode

#### `-j, --join-existing`

Join messages with existing output file.

#### `-x, --exclude-file=FILE.po`

Entries from `FILE.po` are not extracted.

#### `-c, --add-comments=TAG`

Place comment blocks starting with TAG and preceding keyword lines in output
file.  By convention, `TAG` is normally the string `TRANSLATORS:`.

Example:

```javascript
// TRANSLATORS: "Sun" is the abbreviation for "Sunday", not our star.
days[0] = gtx.gettext('Sun');
```

#### `--add-all-comments`

Place all comment blocks preceding keyword lines in output file.

### Language-Specific Options

#### `-a, --extract-all`

Extract all strings.

#### `-k, --keyword=WORD`

Look for `WORD` as an additional keyword. Passing the option without an argument
sets the list of recognized keywords to the empty list.

If you are using [@esgettext/runtime](../runtime/README.md), and just use the
supported keywords, you don't have to bother about specifying keywords yourself
because the default list will do for you.

In its simplest form, a keyword is just the name of a method or function:

```shell
$ esgettext-xgettext --keyword=gettext
```

This would extract the (first!) argument of `gettext('Hello, world!')` or
`some.object.gettext('Hello, world!')`.

It is equivalent to this invocation:

```shell
$ esgettext-xgettext --keyword=gettext:1
```

This translates to "extract the 1st argument of all invocations to `gettext()`".

If a function has a singular and plural argument, you can
specify that like this:

```shell
$ esgettext-xgettext --keyword=ngettext:1,2
```

This would extract the first argument to `ngettext()` as the singular form, and
the second argument as the plural form. The first number is always treated as
the index of the singular, and the second one as the index of the plural
argument.

If the function also has a message context argument, you can specify this as
follows:

```shell
$ esgettext-xgettext --keyword=npgettext:1c,2,3
```

The first argument is then treated as the message context, the second one is
the singular form, and the third argument is the plural form.

You an also specify the total number of arguments that you expect:

```shell
$ esgettext-xgettext --keyword=npgettext:1c,2,3,3t
```

Now, the invocation is only recognized when the total number of arguments is
exactly 3.

Finally, you can also automatically add a comment to the output po file for
certain keywords, by addding it in double-quotes:

```shell
$ esgettext-xgettext --keyword=npgettext:1c,2,3,"\"Plural and Context\""
```

This would add the comment "Plural and Context" to each extracted entry in the
po file.

Note that you have to escape the double-quotes from the shell. A slightly
more readable way to do this is:

```shell
$ esgettext-xgettext --keyword=npgettext:1c,2,3,'"Plural and Context"'
```

#### `--flag=WORD:ARG:FLAG`

Set additional flag `FLAG` for the `ARG`th argument to method `WORD`. Passing
the option without an argument resets the list of flags to empty.

If you are using [@esgettext/runtime](../runtime/README.md), and just use the
supported keywords, you don't have to bother about specifying flags yourself
because the default list will do for you.

Flags are best explained with an example. The method `__x()` for instance has the signature:

```javascript
__x(MSGID, PLACEHOLDERS)
```

For example

```javascript
__x("Hello, {name}!", { name: user.firstName })
```

The corresponding entry in the po file looks like this:

```po
#, perl-brace-format
msgid "Hello, {name}!"
msgstr ""
```

This is achieved because the default list of flags contains
`--flag=__x:1:perl-brace-format` with the meaning that the `1`st argument to
`__x` should have the flag `perl-brace-format`.

The flags can also be negated (`--flag=__y:2:no-perl-brace-format`) or
prefixed with `pass` (`--flag=__z:3:pass-perl-brace-format`).

#### `--instance=WORD`

Only accept method calls of instances `WORD`.

This is useful for avoiding false positives. For example, if you know that the
your `Textdomain` instance is always called `gtx`, you  can pass
`--instance=gtx`. This has the effect that arguments to `gtx.__()` are
extracted but arguments to `something.else.__()` are ignored.

Note that this option is specific to `esgettext-xgettext` and not supported
by [GNU xgettext](https://www.gnu.org/software/gettext/manual/html_node/xgettext-Invocation.html).

### Output Details

#### `--force-po`

The program normally terminates successfully without writing a catalog if the
catalog would be empty. The option `--force-po` ensures that a catalog is
always written.

#### `-w, --width=WIDTH`

Sets the output page width to `WIDTH`.

#### `--no-wrap`

Do not break long message lines, longer than the output page width, into
several lines.

#### `-s, --sort-output`

Sort the entries in the output alphanumerically by `msgid` (original string).

#### `-F, --sort-by-file`

Sort the entries in the output alphanumerically by the filename of the
corresponding source file.

#### `--omit-header`

Don't write header with `msgid ""` entry.

This entry is the first one in po files and contains meta information about
the catalog.

#### `--package-json=FILENAME`

Read default values for catalog meta information in the header from the
JSON file `FILENAME` (or `package.json` if no filename argument is provided).
The following values for command-line options are supported:

```json
{
	"name": "PACKAGE-NAME",
	"version": "PACKAGE-VERSION",
	"author": "COPYRIGHT-HOLDER",
	"bugs": {
		"url": "MSGID-BUGS-ADDRESS"
	},
	"esgettext": {
		"msgid-bugs-address": "MSGID-BUGS-ADDRESS",
		"textdomain": "DOMAIN",
		"directory": "DIRECTORY"
	},
	"output": "..."
}
```

The default value for the option `--output` is guessed based on the textdomain
and output directory.

The value of `esgettext.msgid-bugs-address` takes precedence over `bugs.url`.

Note that this option is specific to `esgettext-xgettext` and not supported
by [GNU xgettext](https://www.gnu.org/software/gettext/manual/html_node/xgettext-Invocation.html).

#### `--copyright-holder`

Set copyright holder in output.

You can also specify this as `author` in `package.json` with
the option [`--package-json`](#--package-jsonfilename).

#### `--foreign-user`

Omit Free Software Foundation (FSF) copyright in output for foreign user.

#### `--package-name`

Set the package name in output.

You can also specify this as `name` in `package.json` with
the option [`--package-json`](#--package-jsonfilename).

#### `--package-version`

Set the package version in output.

You can also specify this as `version` in `package.json` with
the option [`--package-json`](#--package-jsonfilename).

#### `--msgid-bugs-address`

Set report address for msgid bugs

You can also specify this as `esgettext.msgid-bugs-address` or `bugs.url`
in `package.json` with the option [`--package-json`](#--package-jsonfilename).

#### `-m[STRING], --msgstr-prefix[=STRING]`

Use `STRING` or "" as prefix for msgstr values.

#### `-m[STRING], --msgstr-suffix[=STRING]`

Use `STRING` or "" as suffix for msgstr values.

### Informative Output

#### `--help`

Display usage information

#### `--version`

Display the tool's version.

#### `--verbose`

Be verbose.

## Copyright

Copyright (C) 2020-2024 Guido Flohr <guido.flohr@cantanea.com>, all
rights reserved.

This software is available under the terms and conditions of the
[WFTPL](http://www.wtfpl.net/about).
