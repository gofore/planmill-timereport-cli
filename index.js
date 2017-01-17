const pm = require('./lib/planmill')
const moment = require('moment')
const inquirer = require('inquirer')
const loader = require('cli-loader')()
const inquirerAutocompletePrompt = require('inquirer-autocomplete-prompt')
const prettyjson = require('prettyjson')
const getTimeCalcQuestions = require('./time-calc-questions')
const utils = require('./lib/utils')

inquirer.registerPrompt('autocomplete', inquirerAutocompletePrompt)

// Start the spinner
loader.start()

Promise.all([pm.get.projectsWithTasks(), pm.get.requestingUser()])
  .then(([projectTasks, requestingUser]) => {
    // Stop the spinner
    loader.stop()

    // Set some default values
    const defaultFinishTime = moment().format('DD.MM.YYYY HH:mm')
    const defaultLunchbreak = 0.5

    const questions = getTimeCalcQuestions(projectTasks, defaultFinishTime, defaultLunchbreak)

    return inquirer.prompt(questions)
      .then(answers => {
        const timeDiffInMinutes = moment.duration(moment(answers.finish, 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ')
          .diff(moment(answers.start, 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ'))).asMinutes()
        const timeDiffInDecimalHours = timeDiffInMinutes / 60 - answers.lunchbreak
        const amount = utils.roundToClosestQuarter(timeDiffInDecimalHours) * 60
        const project = projectTasks.filter(projTask => projTask.project.name === answers.project)[0]

        return Promise.resolve({
          answers: Object.assign({}, answers, {
            amount,
            finish: moment(answers.finish, 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ')
              .subtract(answers.lunchbreak, 'hours')
              .format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ'),
            project,
            task: project.tasks.filter(task => task.name === answers.task)[0]
          }),
          requestingUser
        })
      })
  })
  .then(({answers, requestingUser}) => {
    const timeReportObj = Object.assign({}, answers, {
      project: answers.project.project.id,
      task: answers.task.id,
      person: requestingUser.id
    })

    delete timeReportObj.lunchbreak
    return pm.post.timereport(timeReportObj)
  })
  .then(data => pm.get.timereportsById(data.id))
  .then(data => {
    const hours = utils.roundToClosestQuarter(data.amount / 60)
    console.log('Successfully inserted following data:')

    console.log(prettyjson.render({
      'Hours reported': hours
    }))
    console.log(prettyjson.render(data))
  })
  .catch(err => {
    console.log(err)
  })

