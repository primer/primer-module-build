const sass = require('node-sass')
const postcss = require('postcss')
const fs = require('fs')
const cssstats = require('cssstats')

module.exports = (str) => {

  const sourceFile = `${process.cwd()}/${str.input[0]}`
  const outputFile = `${process.cwd()}/build/build.css`
  const outputDataFile = `${process.cwd()}/build/index.js`

  // make the build direcotry if it doesn't exist
  fs.mkdir(`${process.cwd()}/build`, (err) => {
    if (err && err.errno !== -17) {
      throw err
    }
  })

  function postcssPlugins() {
    const postcssrc = (() => {
      if (str.flags.postcssconfig && fs.existsSync(`${process.cwd()}/${str.flags.postcssconfig}`)) {
        return require(`${process.cwd()}/${str.flags.postcssconfig}`)
      } else if (fs.existsSync(`${process.cwd()}/.postcss.json`)) {
        return require(`${process.cwd()}/.postcss.json`)
      } else {
        return require('./.postcss.json')
      }
    })()

    return postcssrc.use.map(name => {
      return require(name)(postcssrc[name])
    })
  }

  // Compile the sass
  const sassOutput = sass.renderSync({
    file: sourceFile,
    includePaths: ['node_modules'],
    outputStyle: 'compressed'
  })

  // Process postcss
  postcss(postcssPlugins()).process(sassOutput.css.toString(), {from: sourceFile, to: outputFile}).then(result => {
    fs.writeFileSync(outputFile, result.css)

    const data = {
      "cssstats": cssstats(result.css)
    }
    fs.writeFileSync(outputDataFile, `module.exports = ${JSON.stringify(data)}`)
  })
}
