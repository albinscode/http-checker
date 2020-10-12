const config = require('../config.json')
const commons = require('./commons.js')
const Request = commons.Request
const Promise = require('promise')

const commonsRequest = new commons.Request("twake")

// some shortcuts
const request = commonsRequest.getAxiosRequest()
const sendNotification = commons.sendNotification

const initUrl =  "https://api.twake.app/ajax/users/login"
// no more used
const advancedSearchUrl =  "https://api.twake.app/ajax/globalsearch/advancedbloc"
const lastNotificationsUrl =  "https://api.twake.app/ajax/core/collections/init"

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

const requestLastNotifications = {
    "multiple": [
        {
            "_grouped": true,
            "collection_id": `notifications/${config.twakeId}`,
            "options": {
                "get_options": {},
                "type": "notifications"
            }
        },
        {
            "_grouped": true,
            "collection_id": `updates/${config.twakeId}`,
            "options": {
                "type": "updates"
            }
        },
        {
            "_grouped": true,
            "collection_id": `channels/direct_messages/${config.twakeId}`,
            "options": {
                "get_options": {},
                "type": "channels/direct_messages"
            }
        }
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

// no more used but work done;)
function manageMentionsOfUser() {
    return res.data.data.results
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
}

function manageNotifications(res) {
    return res.data.data[0].data.get
        .slice(0, 10)
        // by desc date
        .sort((m1, m2) => -m1.date.toString().localeCompare(m2.date.toString()))
        // we keep only message
        .reduce( (acc, message) =>
            acc.concat({
                id: message.id,
                author: message.title,
                message: message.text
            })
        , [])
}

function fetch() {

    auth()
    // we then ask for a token to the api
    .then (res => {
        commonsRequest.retrieveCookie(res)
        return request.post(lastNotificationsUrl, requestLastNotifications)
    })
    .then (res => {
        let messages = manageNotifications(res)

        // we check if already in cache
        commonsRequest.updateCache(messages)
    })
    .catch (error => {
        commonsRequest.debugRequest(error, true)
    })
}

module.exports.fetch = fetch
module.exports.commonsRequest = commonsRequest
