const config = require('../config.json')
const commons = require('./commons.js')

const request = commons.getAxiosRequest()

const initUrl =  "https://api.twake.app/ajax/users/login"
const advancedSearchUrl =  "https://api.twake.app/ajax/globalsearch/advancedbloc"

const requestMentionOfUser = {
    "group_id": "56393af2-e5fe-11e9-b894-0242ac120004",
    "options": {
        "mentions": [
            "392723a6-e612-11ea-aa6a-0242ac120004"
        ]
    },
    "words": [
        ""
    ]
}

function fetch() {

    request.post(initUrl, {
        "_password": config.password,
        "_rememberme": false,
        "_username": config.username,
        "device": {}
    })
    // we then ask for a token to the api
    .then (res => {
        commons.retrieveCookie(res)
        return request.post(advancedSearchUrl, requestMentionOfUser)
    })
    .then (res => {
        res.data.data.results.map(message => console.log(message.message))
        let messages = res.data.data.results
            // by desc date
            .sort((m1, m2) => -m1.message.creation_date.toString().localeCompare(m2.message.creation_date.toString()))
            // we keep only message
            .map(message => message.message.content.original_str);

        // we check if already in cache
        commons.updateCache('openpaas-mails.cache', JSON.stringify(messages), () => {
            // not already in cache we notify
            messages.forEach(message => {
               commons.sendNotification('twake', message, 'test.com')
            })
        });


    })
    .catch (error => {
        commons.debugRequest(error)
    })
}

module.exports.fetch = fetch

