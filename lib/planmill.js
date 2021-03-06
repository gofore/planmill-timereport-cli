const path = require('path')
const rp = require('request-promise-native')
const utils = require('./utils')

const configSearchLocations = () => [
  `${process.env.HOME}/.config/planmill/config.json`,
  './config.json'
]

const getConfig = configPath => {
  if (configPath) {
    try {
      return require(path.resolve(configPath))
    } catch (e) {
      const err = new Error(`Unable to open configuration file ${configPath}`)
      throw err
    }
  } else {
    const locations = configSearchLocations()
    for (const l of locations) {
      try {
        return require(path.resolve(l))
      } catch (e) {
        // Not found, move on to the next one
      }
    }

    const err = new Error('Could not find the configuration file')
    throw err
  }
}

const instance = options => {
  const config = getConfig(options.config)

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
        authorization: `Basic ${new Buffer.from(`${config.user}:${config.pass}`).toString('base64')}`
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

  const attachProjectMembersToProjects = projects =>
    Promise.all(projects.map(project => get.projectMembers(project.id)))
      .then(members => Promise.resolve(projects.map((project, index) => {
        project.members = members[index]
        return project
      })))

  const filterOutNonCurrentUserProjects = projects => get.requestingUser()
    .then(requestingUser =>
      Promise.resolve(projects.filter(project =>
        project.members.filter(member => member.id === requestingUser.id))))

  const projectsWithTasks = (filterOutFinished = true) => get.projects(filterOutFinished)
    .then(projects => Promise.resolve(attachProjectMembersToProjects(projects)))
    .then(projects => Promise.resolve(filterOutNonCurrentUserProjects(projects)))
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

  const projects = (filterOutFinished = true) => getInit()
    /* TODO: rowcount 9999999 seems a bit ugly, is there an alternative? */
    .then(() => api.get('projects', { rowcount: 9999999 }))
    .then(projects => Promise.resolve(filterOutFinished ? utils.filterOutFinished(projects) : projects))

  const projectMembers = projectId => getInit()
    .then(() => api.get(`projects/${projectId}/members`))

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
      task,
      person,
      comment,
      'PMVProject.Id': project,
    }

    return api.post('timereports', jsonBody)
  }

  const post = {
    timereport
  }

  const get = {
    projects,
    projectMembers,
    projectsWithTasks,
    tasks,
    timereportsById,
    requestingUser
  }

  return {
    authenticate,
    get,
    post
  }
}

module.exports = { instance }

