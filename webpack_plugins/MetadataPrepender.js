'use strict';
// a webpack plugin that prepend UserScript metadata

const prependFile = require('prepend-file');

// helper function to shallow clone object
function cloneObject(obj) {
    let newObj = {};
    for (let key in obj) {
        newObj[key] = obj[key];
    }
    return newObj;
}

// helper function to replace keys from objB to objA
function extendObject(objA, objB) {
    if (!objB) {
        return;
    }
    for (let key in objB) {
        objA[key] = objB[key];
    }
}

// helper function to convert metadata json to metadata string
function jsonToMetadata(json) {
    let metadata = '// ==UserScript==\n';
    for (let key in json) {
        switch (key) {
        case 'description':
        case 'name':
        case 'namespace':
        case 'version':
        case 'run-at':
            metadata += '// @' + key + ' ' + json[key] + '\n';
            break;
        case 'matches':
        case 'extramatches':
            for (let i = 0; i < json[key].length; i++) {
                metadata += '// @match ' + json[key][i] + '\n';
            }
            break;
        default:

        }
    }
    metadata += '// ==/UserScript==\n\n';
    return metadata;
}

// the prepender constructor used in webpack config
// takes a common metadata and an array of file settings
function MetadataPrepender(commonMetadata, settings) {

    // the apply method, takes webpack compiler
    const apply = (compiler) => {

        // only do job after the webpack build process end
        compiler.plugin('after-emit', (compilation, callback) => {
            // initialize the list of promise of prepend file
            let promises = [];

            // loop through all settings one by one
            for (let i = 0; i < settings.length; i++) {
                const setting = settings[i];

                // extract the specific metadata for this file
                let metadata = cloneObject(commonMetadata);
                extendObject(metadata, setting.replace);
                // make the prepend file process as a promise
                promises.push(new Promise((resolve, reject) => {
                    prependFile(setting.path, jsonToMetadata(metadata), (error) => {
                        if (error) {
                            reject(error);
                        }
                        resolve();
                    });
                }));
            }
            // when all prepend file process ends, continue the webpack build process
            Promise.all(promises).then(() => {
                callback();
            }, (error) => {
                console.log(error);
            });
        });
    };
    return {
        apply: apply
    };
}

// export the constructor
module.exports = MetadataPrepender;
