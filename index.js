const mails = require('./src/openpaas-mails.js')
const twake = require('./src/twake.js')
const commons = require('./src/commons.js')

commons.startNotificationsService()
twake.fetch();
setInterval( () => {
    // mails.fetchMails();
    twake.fetch();
}, 10 * 1000)
