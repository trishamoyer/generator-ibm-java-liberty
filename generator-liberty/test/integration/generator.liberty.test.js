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

/**
 * Tests the Liberty aspects generator
 */
'use strict';
const path = require('path');
const assert = require('yeoman-assert');
const helpers = require('yeoman-test');
const AssertLiberty = require('../../lib/assert.liberty');
const MockPromptMgr = require('../mocks/mock.promptmgr');
const common = require('@arf/java-common');

const ARTIFACTID = 'artifact.0.1';
const GROUPID = 'test.group';
const VERSION = '1.0.0';
const APPNAME = 'testApp';
const FRAMEWORK = 'liberty';

class Options extends AssertLiberty {

  constructor(buildType, createType, platforms, jndiEntries, envEntries, frameworkDependencies, javametrics) {
    super();
    this.conf = {
      headless :  "true",
      debug : "true",
      buildType : buildType,
      createType : createType,
      javametrics : javametrics,
      promptType : 'prompt:liberty',
      platforms : platforms,
      technologies : [],
      jndiEntries : jndiEntries,
      envEntries : envEntries,
      frameworkDependencies :frameworkDependencies,
      appName : APPNAME,
      groupId : GROUPID,
      artifactId : ARTIFACTID,
      version : VERSION
    }
    var ctx = new common.context('test', this.conf, new MockPromptMgr());
    this.options = {
      context : ctx
    };
    this.before = function() {
      return helpers.run(path.join( __dirname, '../../generators/app'))
        .withOptions(this.options)
        .withPrompts({})
        .toPromise();
    }
  }

}

const buildTypes = ['gradle', 'maven'];
const platforms = [[], ['bluemix']];
var jndiEntries = [{name :'jndiName', value:'jndiValue'}];
var envEntries = [{name: 'envName', value : 'envValue'}];
var frameworkDependencies = [{"feature" : "testfeature"}];

describe('java liberty generator : Liberty server integration test', function () {

  buildTypes.forEach(buildType => {
    platforms.forEach(platformArray => {
      describe('Generates server configuration (no technologies) ' + buildType + ' with platforms ' + platformArray, function () {
        var options = new Options(buildType, 'picnmix', platformArray, jndiEntries, envEntries, frameworkDependencies);
        before(options.before.bind(options));
        options.assertAllFiles(true);
        options.assertJavaMetrics(false, buildType);
        options.assertContextRoot(APPNAME);
        options.assertVersion(buildType);
        options.assertPlatforms(platformArray, buildType);
        jndiEntries.forEach(entry => {
          options.assertJNDI(true, entry.name, entry.value);
        });
        envEntries.forEach(entry => {
          options.assertEnv(true, entry.name, entry.value);
        });
        frameworkDependencies.forEach(entry => {
          options.assertFeature(true, entry.feature);
        });
      });
    });

  })

});

describe('Generates server configuration (no technologies) maven with deploy type with java metrics', function () {
  var options = new Options('maven', 'picnmix', 'local', jndiEntries, envEntries, frameworkDependencies, true);
  before(options.before.bind(options));
  options.assertAllFiles(true);
  options.assertJavaMetrics(true, 'maven');
});
