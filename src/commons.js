const fs = require('fs')
const notifier = require('node-notifier')
const axios = require('axios')


const request = axios.create({
  withCredentials: true
})

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
            if (oldContent != content) {
                fs.writeFile(path, content, () => {
                    done()
                })
            }
            else {
                console.log('No new update')
            }
        });
    });
}

/**
 * Gets the cookie from a given response
 */
function retrieveCookie(res)  {

    if (!res.headers['set-cookie']) throw new Error('no cookie received')

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
            // console.log('adding cookie')
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
   console.log(`Message from "${author}" => ${message}`)
   notifier.notify({
            title: author,
            message: message,
            timeout: 30,
            open: url,
            wait: true,
    })
}

module.exports.updateCache = updateCache
module.exports.retrieveCookie = retrieveCookie
module.exports.getAxiosRequest = getAxiosRequest
module.exports.debugRequest = debugRequest
module.exports.sendNotification = sendNotification
module.exports.setBearerToken = setBearerToken
