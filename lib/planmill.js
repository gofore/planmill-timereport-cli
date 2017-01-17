const rp = require('request-promise-native')
const config = require('../config.json')
const utils = require('./utils')

let auth = null
const getInit = () => {
  return !auth ? saveAuthentication() : Promise.resolve()
}

const api = {
  get: (path, query) => {
    return rp.get(`${config.apiEndpoint}/${path}`, {
      headers: {
        'cache-control': 'no-cache',
        authorization: `Bearer ${auth.access_token}`
      },
      qs: query,
      json: true
    }).then(body => Promise.resolve(body))
  },
  post: (path, body, query) => {
    return rp.post(`${config.apiEndpoint}/${path}`, {
      headers: {
        'cache-control': 'no-cache',
        'Content-type': 'application/json; charset=utf-8',
        authorization: `Bearer ${auth.access_token}`
      },
      qs: query,
      json: true,
      body
    }).then(body => Promise.resolve(body))
  }
}

const authenticate = () => {
  return rp
  .post(config.tokenUrl, {
    headers: {
      'cache-control': 'no-cache',
      authorization: `Basic ${new Buffer(`${config.user}:${config.pass}`).toString('base64')}`
    },
    form: {
      grant_type: 'client_credentials'
    }
  })
  .then(body => new Promise((resolve, reject) => resolve(JSON.parse(body))))
}

const saveAuthentication = () => authenticate().then(authRes => {
  auth = authRes
  return Promise.resolve(auth)
})

const projects = (filterOutFinished = true) => getInit()
  /* TODO: rowcount 9999999 seems a bit ugly, is there an alternative? */
  .then(() => api.get('projects', { rowcount: 9999999 }))
  .then(projects => Promise.resolve(filterOutFinished ? utils.filterOutFinished(projects) : projects))

const projectsWithTasks = (filterOutFinished = true) => get.projects(filterOutFinished)
  .then(projects => Promise.all(projects.map(project => get.tasks(project.id)))
    .then(tasks => Promise.resolve({ projects, tasks })))
  .then(({ projects, tasks }) => Promise.resolve(projects.map((project, projIndex) => ({
    project,
    tasks: filterOutFinished ? utils.filterOutFinished(tasks[projIndex]) : tasks[projIndex]
  }))))
  // filter out all the projects with no tasks
  .then(projectTasks => Promise.resolve(projectTasks.filter(projectTask => projectTask.tasks.length)))

const tasks = projectId => getInit()
  /* TODO: rowcount 9999999 seems a bit ugly, is there an alternative? */
  .then(() => api.get(`projects/${projectId}/tasks`), { rowcount: 9999999 })

const timereportsById = (timereportId) => getInit()
  .then(() => api.get(`timereports/${timereportId}`))

const requestingUser = () => getInit()
  .then(() => api.get('me'))

const timereport = ({
  project,
  task,
  person,
  start,
  finish,
  amount,
  comment
}) => {
  const jsonBody = {
    amount,
    start,
    project,
    task,
    person,
    finish,
    comment,
    status: 0
    // totalReported: amount,
    // billableStatus: null,
    // requireBillableComment: null,
    // remainingAmount: null,
    // billableAmount: null,
    // overtimeAmount: null,
    // billingComment: null,
    // overtimeComment: null,
    // travelComment: null,
    // travelAmount: null,
  }

  return api.post('timereports', jsonBody)
}

const get = {
  projects,
  projectsWithTasks,
  tasks,
  timereportsById,
  requestingUser
}

const post = {
  timereport
}

module.exports = {
  authenticate,
  get,
  post
}

