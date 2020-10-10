const mails = require('./src/openpaas-mails.js')
const twake = require('./src/twake.js')

// mails.fetchMails();
twake.fetch();
setInterval( () => {
    // mails.fetchMails();
    twake.fetch();
}, 10 * 1000)
