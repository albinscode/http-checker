const config = require('../config.json')
const commons = require('./commons.js')
const Request = commons.Request
const Promise = require('promise')

const commonsRequest = new commons.Request("twake")

// some shortcuts
const request = commonsRequest.getAxiosRequest()
const sendNotification = commons.sendNotification

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
    return commonsRequest.auth( () => request.post(initUrl, {
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
        commonsRequest.retrieveCookie(res)
        return request.post(advancedSearchUrl, requestMentionOfUser)
    })
    .then (res => {
        let messages = res.data.data.results
            .slice(0, 5)
            // by desc date
            .sort((m1, m2) => -m1.message.creation_date.toString().localeCompare(m2.message.creation_date.toString()))
            // we keep only message
            .reduce( (acc, message) => {

                var location = message.workspace ? message.workspace.name + '/' : '';
                location += message.channel ? message.channel.name : ''
                return acc.concat({
                    author: `${message.message.sender} ${location}`,
                    message: message.message.content.original_str
                })
            }
            , [])


        // we check if already in cache
        commonsRequest.updateCache(JSON.stringify(messages), () => {
            // not already in cache we notify
            messages.forEach(message => {
               sendNotification(message.author, message.message, 'test.com')
            })
        });
    })
    .catch (error => {
        commonsRequest.debugRequest(error)
    })
}

module.exports.fetch = fetch
module.exports.commonsRequest = commonsRequest
