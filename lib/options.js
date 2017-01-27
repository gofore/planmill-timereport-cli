const commandLineArgs = require('command-line-args')
const commandLineUsage = require('command-line-usage')

const optionDefinitions = [
  {
    name: 'help',
    alias: 'h',
    type: Boolean,
    description: 'Display usage guide'

  },
  {
    name: 'config',
    alias: 'c',
    type: String,
    description: 'Set the configuration file to use'
  }
]

const usageSections = [
  {
    header: 'planmill-cli',
    content: 'A tool for interacting with [italic]{planmill}'
  },
  {
    header: 'Options',
    optionList: optionDefinitions
  }
]

const parse = argv => commandLineArgs(optionDefinitions, argv)
const usage = () => commandLineUsage(usageSections)

module.exports = {
  parse,
  usage
}
