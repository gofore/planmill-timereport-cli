const rp = require('request-promise-native')
const config = require('../config.json')

let auth = null
const getInit = () => {
  return !auth ? saveAuthentication() : Promise.resolve()
}

const api = {
  get: path => {
    return rp.get(`${config.apiEndpoint}/${path}`, {
      headers: {
        'cache-control': 'no-cache',
        authorization: `Bearer ${auth.access_token}`
      },
      json: true
    }).then(body => Promise.resolve(body))
  },
  post: (path, body) => {
    return rp.post(`${config.apiEndpoint}/${path}`, {
      headers: {
        'cache-control': 'no-cache',
        'Content-type': 'application/json; charset=utf-8',
        authorization: `Bearer ${auth.access_token}`
      },
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

const projects = () => getInit()
  .then(() => api.get('projects'))

const tasks = projectId => getInit()
  .then(() => api.get(`projects/${projectId}/tasks`))

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

