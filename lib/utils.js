const moment = require('moment')

const filterOutFinished = items => (items || []).filter(item =>
  moment(item.finish, 'YYYY-MM-DD[T]HH:mm:ss.SSSZZ')
  .isSameOrAfter(moment()))

const roundToClosestQuarter = value => Number((Math.round(value * 4) / 4).toFixed(2))

module.exports = {
  filterOutFinished,
  roundToClosestQuarter
}
