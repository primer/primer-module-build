/* eslint-disable func-style */
const sass = require("node-sass")
const path = require("path")
const postcss = require("postcss")
const postcssrc = require("postcss-load-config")
const fse = require("fs-extra")
const cssstats = require("cssstats")
const promisify = require("pify")

module.exports = (str, opts) => {

  const verbose = opts.verbose
  const log = verbose
    ? (...msg) => console.warn(...msg) // eslint-disable-line no-console
    : () => {}

  const cwd = process.cwd()
  const sourceFile = path.join(cwd, str)
  const outputDir = opts.outputDir || path.join(cwd, "build")
  const outputFile = path.join(outputDir, "build.css")
  const outputMapFile = outputFile + ".map"
  const outputDataFile = path.join(outputDir, "stats.json")
  const outputJSFile = path.join(outputDir, "index.js")

  const sassRender = promisify(sass.render)

  const build = () => {
    log("Rendering Sass...")
    return sassRender({
      file: sourceFile,
      includePaths: ["node_modules"],
      outputStyle: "compressed",
      sourceMap: true,
    })
  }

  const postprocess = (res) => {
    log("Post-processing...")
    return postcssrc()
      .catch(error => {
        log("No postcss config found: ", error)
        return {
          plugins: [],
          options: {},
        }
      })
      .then(({plugins, options}) => {
        Object.assign(options, {
          from: sourceFile,
          to: outputFile,
          map: {inline: false},
        })
        log("Writing CSS to %s ...", options.to)
        log(res.css)
        return postcss(plugins).process(res.css, options)
      })
      .then(result => {
        if (outputMapFile && result.map) {
          log("Writing sourcemap to %s ...", outputMapFile)
          return fse.writeFile(outputMapFile, result.map)
            .then(() => result)
        }
        return result
      })
      .then(result => {
        const stats = cssstats(result.css)
        log("Writing stats to %s ...", outputDataFile)
        return fse.writeFile(outputDataFile, JSON.stringify(stats))
      })
      .then(() => {
        const dataFile = path.basename(outputDataFile)
        log("Writing JS to %s ...", outputJSFile)
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
