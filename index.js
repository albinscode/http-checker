const mails = require('./src/openpaas-mails.js')
const twake = require('./src/twake.js')
const commons = require('./src/commons.js')
const config = require('./config.json')
const formatTable = require('./src/gui.js').formatTable

let log4js = require("log4js")
let logger = log4js.getLogger()
logger.level = config.level

logger.info('Launching http checker')

const fetchAll = () => {
    mails.fetch()
    twake.fetch()
    twake.commonsRequest.getCacheContent( (err, content) =>
        formatTable(JSON.parse(content), 'Twake last notifs')
    )
    mails.commonsRequest.getCacheContent( (err, content) =>
        formatTable(JSON.parse(content), 'OpenPaas last unread mails')
    )
}

fetchAll()
setInterval( () => {
    fetchAll()
}, config.timeout * 1000)
