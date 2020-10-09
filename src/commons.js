const fs = require('fs')
const axios = require('axios')
const dbus = require('dbus-native');


const request = axios.create({
  withCredentials: true
})


let notificationService = null
let notificationsSender = null

const cacheDir = '.cache'

// the cookie retrieved during auth
let cookie = ''
// the final bearer token to access to the mail api
let bearer = ''

/*
 * Return the axios request properly configured with interceptors.
 *
 */
function getAxiosRequest() {
    request.defaults.headers.common['User-Agent'] =  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:80.0) Gecko/20100101 Firefox/80.0"
    configureRequestInterceptors();
    return request;
}

/**
 * Updates the cache if not same as already stored.
 * @param cacheFile the file used to cache the content
 * @param content the content to put into cache (only if different from previous one)
 * @param done callback to call if there is no error
 */
function updateCache(cacheFile, content, done) {

    const path = cacheDir + '/' + cacheFile
    fs.mkdir(cacheDir, () => {
        fs.readFile(path, 'utf8', function (err, oldContent) {
            // if (oldContent != content) {
                fs.writeFile(path, content, () => {
                    done()
                })
            // }
        });
    });
}

/**
 * Gets the cookie from a given response
 */
function retrieveCookie(res)  {

    if (!res.headers['set-cookie']) throw new Error('no cookie received')

    console.log(res.headers['set-cookie'])
    let full = res.headers['set-cookie'][0];
    // we keep cookie internally
    cookie = full.substring(0, full.indexOf(';'));
    console.log(`cookie ${cookie} retrieved`)
    return cookie;
}

function configureRequestInterceptors() {
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
    })
}

/**
 * An utility to debug request response error
 */
function debugRequest(error) {
    console.log("Error request")
    if (error.request) {
        console.log('Here are the sent headers of the request:')
        console.log(error.request._header)
    }
    else {
        console.log(error)
    }
}

/**
 * Sets the bearer token that will be used for each request
 */
function setBearerToken(bearerToken) {
    bearer = bearerToken
}

function sendNotification(author, message, url) {
    console.log(`Unread message from "${author}" => ${message}`)

    let extras = [
        'test of extras', [ 's', 'this is my string']

    ]

    // dbus call
    notificationsSender.Notify('', 0, '', author, message, [], [extras],  30 * 1000, (err, id) => {
        console.log('notif envoyée')
        console.log(id)
        console.log(err)
    })
}

/**
 * I tried to use node-notifier package but it is just a
 * wrapping of send-notify (in case of linux).
 * So we could not use callbacks or else...
 * See https://specifications.freedesktop.org/notification-spec/latest/ar01s09.html for doc
 * about dbus.
 */
function startNotificationsService() {

    notificationService = dbus.sessionBus()

    notificationService.getService('org.freedesktop.Notifications').getInterface(
        '/org/freedesktop/Notifications',
        'org.freedesktop.Notifications', (err, notifications) => {

        notificationsSender = notifications
        // dbus signals are EventEmitter events
        notifications.on('ActionInvoked', () => {
            console.log('ActionInvoked', arguments)
        })
        notifications.on('NotificationClosed', (id, closeCode) => {
            if (closeCode === 2) console.log('NotificationClosed by user')
        })
    })
}

module.exports.updateCache = updateCache
module.exports.retrieveCookie = retrieveCookie
module.exports.getAxiosRequest = getAxiosRequest
module.exports.debugRequest = debugRequest
module.exports.sendNotification = sendNotification
module.exports.setBearerToken = setBearerToken
module.exports.startNotificationsService = startNotificationsService
