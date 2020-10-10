const config = require('../config.json')
const commons = require('./commons.js')

const request = commons.getAxiosRequest()

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
                    "045a5ba0-eec5-11ea-8665-3109e4489b2e"
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

function fetchMails() {
    // we log to the application using html form
    request.post(initUrl, {
        "password": config.password,
        "recaptcha": {
            "data": null,
            "needed": false
        },
        "rememberme": false,
        "username": config.username
    })
    // we then ask for a token to the api
    .then (res => {
        commons.retrieveCookie(res);
        return request.post(tokenUrl)
    })
    .then (res => {
        // we have the bearer token in data
        commons.setBearerToken(res.data)
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

        let messageBodies = messages.map((message) => message.preview)

        // we check if already in cache
        commons.updateCache('openpaas-mails.cache', JSON.stringify(messageBodies), () => {
            // not already in cache we notify
            messages.forEach(message => {
               commons.sendNotification(message.from.name, message.preview, 'test.com')
            })
        });
    })
    .catch (error => {
        commons.debugRequest(error)
    })
}

module.exports.fetchMails = fetchMails;




