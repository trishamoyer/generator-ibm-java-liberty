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

'use strict';

const constant = require('../../lib/constant')
const Generator = require('yeoman-generator');
const extend = require('extend');
const Defaults = require('../../lib/defaults');
const OpenApi = require('../../lib/openapi');

const defaults = new Defaults();
const logId = require('../../package.json').name;

module.exports = class extends Generator {

  constructor(args, opts) {
    super(args, opts);
    //create command line options that will be passed by YaaS
    defaults.setOptions(this);
    extend(this, opts.context); //inject the objects and functions directly into 'this' to make things easy
    this.logger.writeToLog(`${logId}:constructor - context`, opts.context);
    this.patterns.push('picnmix');
    this.conf.addMissing(opts, defaults);
    this.openApiDir = [];
    this.conf.enableApiDiscovery = this.config.enableApiDiscovery || false;
    this.logger.writeToLog(`${logId}:constructor -  conf (final)`, this.conf);
  }

  initializing() {}

  prompting() {
    //this generator does not prompt, questions can be set in the prompts directory for testing purposes
  }

  configuring() {
    this.configure(this);
    if (this.conf.technologies.includes('swagger')) {
      this.conf.enableApiDiscovery = true;
    }
    this.openApiDir = [];
    if (this.conf.bluemix && this.conf.bluemix.openApiServers && this.conf.bluemix.backendPlatform == 'JAVA') {
      this.conf.enableApiDiscovery = true;
      return OpenApi.generate(this.conf.bluemix.openApiServers)
        .then(dir => {
          this.openApiDir = dir;
        });
    }
  }

  writing() {
    if (this.conf.buildType == 'maven') {
      this.conf.bxBuildCmd = '`mvn install -Pbluemix -Dcf.org=[your email address] -Dcf.username=[your username] -Dcf.password=[your password]`';
    }
    if (this.conf.buildType == 'gradle') {
      this.conf.bxBuildCmd = '`gradle build cfPush -PcfOrg=[your email address] -PcfUsername=[your username] -PcfPassword=[your password]`';
    }
    if (this.conf.libertyVersion === undefined) {
      this.conf.libertyVersion = constant.libertyVersion
    } else if (this.conf.libertyVersion === 'beta') {
      this.conf.libertyBeta = true
      this.conf.libertyVersion = constant.libertyBetaVersion
    }
    if (this.openApiDir.length > 0) {
      OpenApi.writeFiles(this.openApiDir, this);
    }
    return this.defaultWriter(this); //use the default writer supplied by the context.
  }

  end() {}
};