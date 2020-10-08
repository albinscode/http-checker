const fs = require('fs')

const cacheDir = '.cache'

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
        });
    });
}

module.exports.updateCache = updateCache
