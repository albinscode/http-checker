/**
 * This module is NOT shared when required with commonjs.
 * It is like a new instance of a class.
 * It allows to save all variables for a given context:
 * one for twake, one for openpaas, etc...
 */
const fs = require('fs')
const notifier = require('node-notifier')
const axios = require('axios')
const log4js = require("log4js")
const logger = log4js.getLogger()

const request = axios.create({
  withCredentials: true
})

const cacheDir = '.cache'

let connector = ''

// the cookie retrieved during auth
let cookie = ''
// the final bearer token to access to the mail api
let bearer = ''

function init(conn) {
    connector = conn
}

/*
 * Return the axios request properly configured with interceptors.
 *
 */
function getAxiosRequest() {
    request.defaults.headers.common['User-Agent'] =  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:80.0) Gecko/20100101 Firefox/80.0"
    configureRequestInterceptors();
    return request;
}

// return a promise with cookie if already exists
// or will log to app if not existing
// the callback shall return a promise to be compatible!
function auth(callbackIfNotAuthenticated) {

    // reject never happens
    if (cookie) {
        logger.debug(`cookie is ${cookie} for ${connector}`)
        return new Promise((resolve, reject) => resolve('cookie already provided'))
    }
    logger.debug(`there is no cookie we have to fetch it ${cookie} for ${connector}`)

    return callbackIfNotAuthenticated()
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
            if (oldContent != content) {
                fs.writeFile(path, content, () => {
                    done()
                })
            }
            else {
                logger.info('No new update')
            }
        });
    });
}

/**
 * Gets the cookie from a given response
 */
function retrieveCookie(res)  {

    // no need to fetch a new cookie
    if (cookie) return cookie;

    if (!res.headers['set-cookie']) throw new Error(`no cookie received for ${connector}`)

    let full = res.headers['set-cookie'][0];
    // we keep cookie internally
    cookie = full.substring(0, full.indexOf(';'));
    return cookie;
}

function configureRequestInterceptors() {
    // Add a request interceptor to add cookies and bearer token
    request.interceptors.request.use((config) => {
        // Do something before request is sent
        if (cookie != '') {
            logger.debug(`adding fresh cookie for ${connector}`)
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
    logger.error("Error on request")
    if (error.request) {
        logger.error(`Here are the sent headers of the request: ${error.request._header}`)
    }
    else {
        logger.error(error)
    }
}

/**
 * Sets the bearer token that will be used for each request
 */
function setBearerToken(bearerToken) {
    bearer = bearerToken
}

function getCookie() {
    return cookie
}

function sendNotification(author, message, url) {
   console.log(`Message from "${author}" => ${message}`)
   notifier.notify({
            title: author,
            message: message,
            timeout: 30,
            open: url,
            wait: true,
    })
}

exports.instanceinit = init
exports.updateCache = updateCache
exports.retrieveCookie = retrieveCookie
exports.getAxiosRequest = getAxiosRequest
exports.debugRequest = debugRequest
exports.sendNotification = sendNotification
exports.setBearerToken = setBearerToken
exports.auth = auth

console.log(exports)
