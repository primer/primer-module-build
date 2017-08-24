const sass = require("node-sass")
const path = require("path")
const postcss = require("postcss")
const postcssrc = require("postcss-load-config")
const fs = require("fs")
const fse = require("fs-extra")
const cssstats = require("cssstats")
const promisify = require("pify")

module.exports = (str, opts) => {

  const cwd = process.cwd()
  const sourceFile = path.join(cwd, str)
  const outputDir = path.join(cwd, "build")
  const outputFile = path.join(outputDir, "build.css")
  const outputMapFile = outputFile + ".map"
  const outputDataFile = path.join(outputDir, "stats.json")
  const outputJSFile = path.join(outputDir, "index.js")

  const sassRender = promisify(sass.render)

  const build = () => {
    // console.warn("Sass rendering ...")
    return sassRender({
      file: sourceFile,
      includePaths: ["node_modules"],
      outputStyle: "compressed",
      sourceMap: true,
    })
  }

  const postprocess = (res) => {
    // console.warn("Post-processing...")
    return postcssrc()
      .catch(error => {
        console.warn("No postcss config found")
        return {plugins: [], options: {}}
      })
      .then(({plugins, options}) => {
        Object.assign(options, {
          from: sourceFile,
          to: outputFile,
          map: {inline: false},
        })
        return postcss(plugins).process(res.css, options)
      })
      .then(result => {
        // console.warn("Writing CSS to %s ...", outputFile)
        return fse.writeFile(outputFile, result.css)
          .then(() => {
            if (result.map) {
              // console.warn("Writing sourcemap to %s ...", outputMapFile)
              return fse.writeFile(outputFile + ".map", result.map)
            } else {
              // console.warn("(No source map)")
            }
          })
          .then(() => result.css)
      })
      .then(css => {
        const stats = cssstats(css)
        // console.warn("Writing stats to %s ...", outputDataFile)
        return fse.writeFile(outputDataFile, JSON.stringify(stats))
      })
      .then(() => {
        const dataFile = path.basename(outputDataFile)
        // console.warn("Writing JS to %s ...", outputJSFile)
        return fse.writeFile(outputJSFile, `module.exports = {cssstats: require("./${dataFile}")}`)
      })
  }

  return fse.mkdirp(path.dirname(outputFile))
    .then(build)
    .then(postprocess)
    .then(() => ({
      css: outputFile,
      sourcemap: outputMapFile,
      data: outputDataFile,
      js: outputJSFile,
    }))
}
