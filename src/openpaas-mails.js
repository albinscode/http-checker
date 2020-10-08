const notifier = require('node-notifier')
const config = require('../config.json')
const commons = require('./commons.js')

const axios = require('axios')
const request = axios.create({
  withCredentials: true
})

request.defaults.headers.common['User-Agent'] =  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:80.0) Gecko/20100101 Firefox/80.0"

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

// the cookie retrieved during auth
let cookie = ''
// the final bearer token to access to the mail api
let bearer = ''

// Add a request interceptor to add cookies and bearer token
request.interceptors.request.use((config) => {
    // Do something before request is sent
    if (cookie != '') {
        console.log('adding cookie')
        config['headers']['Cookie'] = cookie
    }
    if (bearer != '') {
        config['headers']['Authorization'] = 'Bearer ' + bearer
    }
    return config
  }, (error) => {
    return Promise.reject(error)
  });

function retrieveCookie(res)  {
    console.log(res.headers['set-cookie'])
    let full = res.headers['set-cookie'][0];
    cookie = full.substring(0, full.indexOf(';'));
    console.log(`Sending cookie ${cookie}`)
    return cookie;
}

function fetchMails() {
    // we log to the application using html form
    console.log('Login request')
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
        console.log('Token request')
        retrieveCookie(res);
        return request.post(tokenUrl)
    })
    .then (res => {
        console.log("Mail request")
        // we have the bearer token in data
        bearer = res.data
        cookie = ''
        return request.post(mailUrl, requestMessageIds)
    })
    .then (res => {
        // gathering messages ids
        let messageIds = res.data[0][1]['messageIds']
        // messageIds.map(id => console.log(`Message id "${id}"`))
        requestMessageContents[0][1]['ids'] = messageIds
        return request.post(mailUrl, requestMessageContents)
    })
    .then (res => {
        // gathering message contents
        // console.log(res)
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
               console.log(`Unread message from "${message.from.name}" => ${message.preview}`)
               notifier.notify({
                        title: message.from.name,
                        message: message.preview,
                        timeout: 30,
                        open: initUrl,
                        wait: true,
                })
               notifier.on('click', () => {
               })
            })
        });
    })
    .catch (error => {
        console.log("Error request")
        if (error.request) {
            console.log('Here are the sent headers of the request:')
            console.log(error.request._header)
        }
        else {
            console.log(error)
        }
    })
}

module.exports.fetchMails = fetchMails;




