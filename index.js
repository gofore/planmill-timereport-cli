const pm = require('./lib/planmill')
const moment = require('moment')
const inquirer = require('inquirer')
const loader = require('cli-loader')()
loader.start()

pm.get.projects()
  .then(projects => Promise.resolve(projects))
  .then(projects => pm.get.requestingUser().then(requestingUser => Promise.resolve({requestingUser, projects})))
  .then(({requestingUser, projects}) => Promise.all(projects.map(project => pm.get.tasks(project.id)))
      .then(tasks => Promise.resolve({ projects, requestingUser, tasks })))
  .then(({projects, requestingUser, tasks}) => {
    const projectTasks = projects.map((project, projIndex) => ({
      project,
      tasks: tasks[projIndex]
    }))

    const defaultFinishTime = moment().format('DD.MM.YYYY HH:mm')
    const defaultLunchbreak = 0.5

    const questions = [
      {
        type: 'input',
        name: 'start',
        message: 'What time did you start?',
        validate: value => {
          const isValid = moment(value, 'HH:mm').isValid()
          return (!isValid && 'Please enter a valid time') || true
        },
        filter: value => moment(value, 'HH:mm').format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ')
      },
      {
        type: 'input',
        name: 'finish',
        message: `What time did you finish (${defaultFinishTime})?`,
        validate: value => {
          if (!value) {
            return true
          }
          const isValid = moment(value, 'HH:mm').isValid()
          return (value && !isValid && 'Please enter a valid time') || true
        },
        filter: value => {
          const m = !value ? moment() : moment(value, 'HH:mm')
          return m.format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ')
        }
      },
      {
        type: 'input',
        name: 'lunchbreak',
        message: `How long lunch break did you have (${defaultLunchbreak})?`,
        validate: value => {
          // TODO: validation doesnt work correctly
          if (String(value).match(/\d+(\.\d{1,2})?/) && !isNaN(value)) {
            return true
          }
          return (value && !isValid && 'Please enter a valid time') || true
        },
        filter: value => !value ? defaultLunchbreak : Number(value)
      },

      {
        type: 'list',
        name: 'project',
        message: 'What project?',
        choices: projectTasks.map(projTask => projTask.project.name),
        filter: val => projectTasks.filter(projTask => projTask.project.name === val)[0]
      }
    ]
    loader.stop()

    return inquirer.prompt(questions)
      .then(answers => {
        const timeDiffInMinutes = moment.duration(moment(answers.finish, 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ')
          .diff(moment(answers.start, 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ'))).asMinutes()
        const timeDiffInDecimalHours = timeDiffInMinutes / 60 - answers.lunchbreak

        const amount = Number((Math.round(timeDiffInDecimalHours * 4) / 4).toFixed(2)) * 60
        return Promise.resolve({
          answers: Object.assign({amount}, answers, {
            finish: moment(answers.finish, 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ').subtract(answers.lunchbreak, 'hours')
            .format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ')
          }),
          requestingUser
        })
      })
  })
  .then(({answers, requestingUser}) => {
    const questions = [{
      type: 'list',
      name: 'task',
      message: 'What task?',
      choices: answers.project.tasks.map(task => task.name),
      filter: val => answers.project.tasks.filter(task => task.name === val)[0]
    }, {
      type: 'input',
      name: 'comment',
      message: 'Leave a description?'
    }]

    return inquirer.prompt(questions)
    .then(answers2 => Promise.resolve({
      answers: Object.assign({}, answers, answers2),
      requestingUser
    }))
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
  .then(data => {
    console.log('WIN! Planmill defeated! LOL!', data)
  })
  .catch(err => {
    console.log(err)
  })

