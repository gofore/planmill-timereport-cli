const moment = require('moment')
const Fuse = require('fuse.js')

module.exports = (projectTasks, defaultFinishTime, defaultLunchbreak) => {
  return [{
    type: 'input',
    name: 'start',
    message: 'What time did you start?',
    validate: value => {
      const isValid = moment(value, 'HH:mm').isValid()
      return (!isValid && 'Please enter a valid time') || true
    },
    filter: value => moment(value, 'HH:mm').format('YYYY-MM-DD[T]HH:mm:ss.SSSZZ')
  }, {
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
  }, {
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
  }, {
    type: 'autocomplete',
    name: 'project',
    message: 'What project?',
    source: (answersSoFar, input) => {
      const projectNames = projectTasks.map(projTask => projTask.project.name)
      if (!input) {
        return Promise.resolve(projectNames)
      }
      const searchResults = (new Fuse(projectNames, { findAllMatches: false })).search(input)
      const filteredProjectNames = searchResults.map(index => projectNames[index])
      return Promise.resolve(filteredProjectNames)
    }
  }, {
    type: 'autocomplete',
    name: 'task',
    message: 'What task?',
    source: (answersSoFar, input) => {
      const taskNames = projectTasks
        .filter(projTask => projTask.project.name === answersSoFar.project)[0]
        .tasks.map(task => task.name)

      if (!input) {
        return Promise.resolve(taskNames)
      }
      const searchResults = (new Fuse(taskNames, { findAllMatches: false })).search(input)
      const filteredTaskNames = searchResults.map(index => taskNames[index])

      return Promise.resolve(filteredTaskNames)
    }
  }, {
    type: 'input',
    name: 'comment',
    message: 'Leave a description?'
  }]
}
