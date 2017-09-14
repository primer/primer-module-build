const fs = require("fs")
const test = require("ava")
const build = require("../lib/build.js")
const path = require("path")

test("builds test css", t => {
  return build("./tests/test.scss", {})
    .then(output => {
      /*eslint-disable*/
      console.log(fs.readdirSync(path.join(process.cwd(),"build")));
      Object.keys(output).forEach(key => {
        t.is(fs.existsSync(output[key]), true, `No ${key} output: ${output[key]}`)
      })
    })
})
