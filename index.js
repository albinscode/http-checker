const mails = require('./src/openpaas-mails.js')
const twake = require('./src/twake.js')
const commons = require('./src/commons.js')
const config = require('./config.json')
const formatTable = require('./src/gui.js').formatTable

let log4js = require("log4js")
let logger = log4js.getLogger()
logger.level = config.level

logger.info('Launching http checker')



// commons.sendNotification('test', '<b>test albo</b> <a href="test.com">atessdfsdf</a>')

const fetchAll = () => {
    mails.fetch()
    twake.fetch()
    twake.commonsRequest.getCacheContent( (err, content) =>
        console.log(formatTable(JSON.parse(content)))
    )
    mails.commonsRequest.getCacheContent( (err, content) =>
        console.log(formatTable(JSON.parse(content)))
    )
}

fetchAll()
setInterval( () => {
    fetchAll()
}, config.timeout * 1000)
