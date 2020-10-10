/**
 * Some utilities all in one.
 * I don't wan't to use ES6 class because I wan't
 * to use as much function as possible and avoid this operator ;)
 */
const fs = require('fs')
const notifier = require('node-notifier')
const axios = require('axios')
const log4js = require("log4js")
const logger = log4js.getLogger()

const cacheDir = '.cache'

/**
 * We provide a prototype to have distinct cookies by app!
 */
function Request(conn) {

    // a dedicated request by app
    const request = axios.create({
      withCredentials: true
    })

    let connector = conn

    // the cookie retrieved during auth
    let cookie = ''
    // the final bearer token to access to the mail api
    let bearer = ''

    /*
     * Return the axios request properly configured with interceptors.
     *
     */
    this.getAxiosRequest = function() {
        request.defaults.headers.common['User-Agent'] =  "Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:80.0) Gecko/20100101 Firefox/80.0"
        this.configureRequestInterceptors();
        return request;
    }

    // return a promise with cookie if already exists
    // or will log to app if not existing
    // the callback shall return a promise to be compatible!
    this.auth = function(callbackIfNotAuthenticated) {

        // reject never happens
        if (cookie) {
            logger.debug(`cookie is ${cookie} for ${connector}`)
            return new Promise((resolve, reject) => resolve('cookie already provided'))
        }
        logger.debug(`there is no cookie we have to fetch it for ${connector}`)

        return callbackIfNotAuthenticated()
    }

    /**
     * Gets the cookie from a given response
     */
    this.retrieveCookie = function(res)  {

        // no need to fetch a new cookie
        if (cookie) return cookie;

        if (!res.headers['set-cookie']) throw new Error(`no cookie received for ${connector}`)

        let full = res.headers['set-cookie'][0];
        // we keep cookie internally
        cookie = full.substring(0, full.indexOf(';'));
        return cookie;
    }

    this.configureRequestInterceptors = function() {
        // Add a request interceptor to add cookies and bearer token
        request.interceptors.request.use((config) => {
            // Do something before request is sent
            if (cookie != '') {
                logger.debug(`adding existing cookie for ${connector}`)
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
     * Sets the bearer token that will be used for each request
     */
    this.setBearerToken = function(bearerToken) {
        bearer = bearerToken
    }

    this.getCookie = function() {
        return cookie
    }

    /**
     * An utility to debug request response error
     */
    this.debugRequest = function(error) {
        logger.error("Error on request")
        if (error.request) {
            logger.error(`Here are the sent headers of the request for ${connector}: ${error.request._header}`)
        }
        else {
            logger.error(error)
        }
    }

    function getPath() {
        return  `${cacheDir}/${connector}.cache`
    }

    /**
     * Updates the cache if not same as already stored.
     * @param cacheFile the file used to cache the content
     * @param content the content to put into cache (only if different from previous one)
     * @param done callback to call if there is no error
     */
    this.updateCache = function(content, done) {

        this.getCacheContent( (err, oldContent)  => {
            if (oldContent != content) {
                fs.writeFile(getPath(), content, () => done() )
            }
            else {
                logger.info(`No new update for ${connector}`)
            }
        });
    }

    this.getCacheContent = function(callback) {
        fs.mkdir(cacheDir, () => {
            fs.readFile(getPath(), 'utf8', (err, content) =>  callback(err, content))
        })
    }
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

// export the prototype
module.exports.Request = Request

// some function utilities
module.exports.sendNotification = sendNotification
