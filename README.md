[![licence](https://img.shields.io/badge/licence-WTFPL-blue)](http://www.wtfpl.net/)
[![coverage](https://img.shields.io/coverallsCoverage/github/gflohr/esgettext?branch=main)](https://coveralls.io/github/gflohr/e-invoice-eu?branch=main)
[![documentation](https://img.shields.io/badge/documentation-Qgoda🍓-ffc107)](https://www.qgoda.net/)

# esgettext

Gettext for ECMAScript also known as JavaScript.

## Packages

This mono-repo contains the following packages:

- [runtime](packages/runtime/README.md)
- [tools](packages/tools/README.md)

## Setup

```
$ npm install
$ yarn run test
```

## Prerequisites

See the [prerequisites of the esgettext
tools](<(packages/tools/README.md#prerequisites)>).

## Getting Started

Create a repository, populate it with some source file and then prepare it
for internationalization (i18n):

```
$ npx esgettext init --dry-run --verbose
```

Run the command again without `--dry-run`, when you are happy with the
output.

The command has created an esgettext configuration file, or - depending on your
choice - a section inside your `package.json`. It has also added a bunch
of scripts inside `package.json`. In the future, it will be enough to just
run `npm run esgettext` to get everything up-to-date for translations. At the
moment, this will still fail until you have started marking strings as
translatable (see [@esgettxt/runtime](<(packages/runtime/README.md)>) for
more information) and you have added the first language to your project.

## Copyright

Copyright (C) 2020-2024 Guido Flohr <guido.flohr@cantanea.com>, all
rights reserved.

This software is available under the terms and conditions of the
[WFTPL](http://www.wtfpl.net/about).
