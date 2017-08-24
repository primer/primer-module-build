#!/usr/bin/env node
/* eslint-disable no-console */
'use strict'
const meow = require('meow')
const build = require('./')

const cli = meow(`
  Usage
    $ primer-module-build [file]

  Options
    -v, --verbose   Output more verbose info to stderr

  File
    File. This is required. The file input is the .scss file that
    will be built into .css. The build automatically looks in the
    node_modules/ directory for any inputs.

  Example
    $ primer-module-build index.scss
`, {
  alias: {
    v: 'verbose',
  },
  'boolean': ['v']
})

build(cli)
  .catch(error => {
    console.error(`Unable to build: ${error}`)
    process.exit(1)
  })
  .then(() => {
    process.exit(0)
  })
