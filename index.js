const mails = require('./src/openpaas-mails.js')
const twake = require('./src/twake.js')
const commons = require('./src/commons.js')
const config = require('./config.json')

let log4js = require("log4js")
let logger = log4js.getLogger()
logger.level = config.level

logger.info('Launching http checker')

// commons.sendNotification('test', '<b>test albo</b> <a href="test.com">atessdfsdf</a>')

mails.fetchMails()
twake.fetch();
setInterval( () => {
    mails.fetchMails();
    twake.fetch();
}, config.timeout * 1000)
