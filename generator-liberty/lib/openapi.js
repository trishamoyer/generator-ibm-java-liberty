/*
 * Copyright IBM Corporation 2017
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// module for generating code from open api document

const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const appAccUrl = 'https://liberty-app-accelerator.wasdev.developer.ibm.com';
const appAccEndpoint = appAccUrl + '/start/api/v1';
const appAccSwagger = appAccUrl + '/swagger/api/v1/provider';
const unzip = require('unzip2');
const request = require('request');
const Promise = require('bluebird');
const requestAsync = Promise.promisify(request);
Promise.promisifyAll(request);

var generate = function(docs) {
    var openApiDir = [];
    var p = new Promise((resolve, reject) => {
        var i = 0;
        docs.forEach(doc => {
            generateFromDoc(doc.spec)
            .then(sdk => {
                openApiDir.push(sdk);
                if (++i === docs.length) {
                resolve(openApiDir);
                }
            });
        });
    });
    return p;
}

var generateFromDoc = function(doc) {
    const { sep } = require('path');
    var tempDir = fs.mkdtempSync(os.tmpDir() + sep);
    var id = undefined;
    return request.getAsync({
        url: appAccEndpoint + '/workspace'
    }).then(response => {
        id = response.body;
        return request.postAsync({
            url: appAccEndpoint + '/upload?tech=swagger&cleanup=true&process=true&workspace=' + id,
            method: 'POST',
            formData: {'swaggerDefinition': {value: doc, options: {filename: 'swaggerDefinition', contentType: 'application/json'}}}
        })
    }).then(response => {
        if(!response.body.includes('success')) {
            throw new Error('Open api file upload failed.');
        }
        return getGeneratedContent(id);
    })
}

var getGeneratedContent = function(id) {
  return new Promise((resolve, reject) => {
    const { sep } = require('path');
    var tempDir = fs.mkdtempSync(os.tmpDir() + sep);
    request.get({
      headers: { 'Accept': 'application/zip' },
      url: appAccEndpoint + '/workspace/files?workspace=' + id + '&serviceId=swagger&dir=server'
    })
    .on('error', err => {
      reject(new Error('Getting files from app accelerator failed with: ', err.message))
    })
    .pipe(unzip.Extract({ path: tempDir }))
    .on('close', () => {
      resolve(tempDir)
    })
  })
}

var getWorkspaceID = function() {
    return request.getAsync({
        url: appAccelUrl + '/workspace'
    });
}

var writeFiles = function(dirs, generator) {
    dirs.forEach(tempDir => {
        generator.fs.copy(path.join(tempDir, 'swagger', 'server', 'src'), generator.destinationPath('src'));
    });
}

module.exports = {
    generate : generate,
    writeFiles : writeFiles
}