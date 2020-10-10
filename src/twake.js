const config = require('../config.json')
const commons = require('./commons.js')
commons.init('twake')
const Promise = require('promise')

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

// authenticate to twake, only cookie needed
function auth() {

    // we call the generic auth with specific twake callback
    return commons.auth( () => request.post(initUrl, {
        "_password": config.password,
        "_rememberme": false,
        "_username": config.username,
        "device": {}
    }))
}

function fetch() {

    auth()
    // we then ask for a token to the api
    .then (res => {
        commons.retrieveCookie(res)
        return request.post(advancedSearchUrl, requestMentionOfUser)
    })
    .then (res => {
        let messages = res.data.data.results
            // by desc date
            .sort((m1, m2) => -m1.message.creation_date.toString().localeCompare(m2.message.creation_date.toString()))
            // we keep only message
            .map(message => message.message.content.original_str);

        // we check if already in cache
        commons.updateCache('twake.cache', JSON.stringify(messages), () => {
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

