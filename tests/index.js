const test = require("ava")
const build = require("../lib/build.js")

process.chdir('../')

test("builds test css", t => {
  try {
    build("./tests/test.scss", {})
  } catch (e) {
    t.fail(e)
  }
})
