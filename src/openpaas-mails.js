const config = require('../config.json')
const commons = require('./commons.js')
const Request = commons.Request

const commonsRequest = new commons.Request("openpaas")

// some shortcuts
const request = commonsRequest.getAxiosRequest()
const sendNotification = commons.sendNotification

const initUrl =  "https://openpaas.linagora.com/api/login"
const tokenUrl =  "https://openpaas.linagora.com/api/jwt/generate"
const mailUrl =  "https://jmap.linagora.com/jmap"

const requestMessageIds =
[
    [
        "getMessageList",
        {
            "collapseThreads": false,
            "fetchMessages": false,
            "filter": {
                "inMailboxes": [
                    `${config.openpaasId}`
                ],
                "text": null
            },
            "limit": 10,
            "position": 0,
            "sort": [
                "date desc"
            ]
        },
        "#0"
    ]
]

const requestMessageContents =
[
    [
        "getMessages",
        {
            "ids": [
            ],
            "properties": [
                "id",
                "blobId",
                "threadId",
                "headers",
                "subject",
                "from",
                "to",
                "cc",
                "bcc",
                "replyTo",
                "preview",
                "date",
                "isUnread",
                "isFlagged",
                "isDraft",
                "hasAttachment",
                "mailboxIds",
                "isAnswered",
                "isForwarded"
            ]
        },
        "#0"
    ]
]

let messageIds = []
// const requestMessageContents =

// authenticate to openpaas, cookie and beare token needed
function auth() {

    // we log to the application using html form
    // then we generate token
    return commonsRequest.auth( () => request.post(initUrl, {
            "password": config.password,
            "recaptcha": {
                "data": null,
                "needed": false
            },
            "rememberme": false,
            "username": config.username
        })
        .then (res => {
            commonsRequest.retrieveCookie(res)
            return request.post(tokenUrl)
        })
        .then (res => {
            // we have the bearer token in data
            commonsRequest.setBearerToken(res.data)
            return new Promise((resolve, reject) => resolve())
        })
    )

}

function fetch() {
    auth()
    .then (res => {
        return request.post(mailUrl, requestMessageIds)
    })
    .then (res => {
        // gathering messages ids
        let messageIds = res.data[0][1]['messageIds']
        requestMessageContents[0][1]['ids'] = messageIds
        return request.post(mailUrl, requestMessageContents)
    })
    .then (res => {
        // gathering message contents
        let messages = res.data[0][1]['list']
            // we keep only unread messages
            .filter(message => message.isUnread)
            // we sort to avoid bad cache (same content in other order)
            .sort( (m1, m2) => m1.id.localeCompare(m2.id))

        let messageBodies = messages.reduce((acc, message) => acc.concat( {
            author: message.from.name,
            message: message.preview
        }), [])

        // we check if already in cache
        commonsRequest.updateCache(JSON.stringify(messageBodies), () => {
            // not already in cache we notify
            messages.forEach(message => {
               sendNotification(message.from.name, message.preview, '')
            })
        });
    })
    .catch (error => {
        commonsRequest(error)
    })
}

module.exports.fetch = fetch
module.exports.commonsRequest = commonsRequest




