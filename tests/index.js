const fs = require("fs")
const test = require("ava")
const build = require("../lib/build.js")

test("builds test css", t => {
  return build("./tests/test.scss", {})
    .then(output => {
      Object.entries(output).forEach(([key, file]) => {
        t.is(fs.existsSync(file), true, `No ${key} output: ${file}`)
      })
    })
})
