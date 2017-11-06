/* global define, $ */
"use strict";

window.less = {
	env: "development",
	'async': true
};

define(function(require, exports, module) {
	var ExtensionManager = require('core/extensionManager');
	
	var App = require('core/app');
	var FileManager = require('core/fileManager');
	var Utils = require('core/utils');
	
	var Less = require('./less');
	
	var EditorEditors = require('modules/editor/ext/editors');
	var EditorCompiler = require('modules/editor/ext/compiler');
	
	class Extension extends ExtensionManager.Extension {
		constructor() {
			super({
				name: 'less-compiler',
			});
			
			this.watcher = null;
			
			this.compilerName = 'LESS';
		}
		
		init() {
			super.init();
			
			var self = this;
			
			this.watcher = EditorCompiler.addWatcher(this.name, {
				extensions: ['less'],
				outputExtension: 'css',
				comments: true,
				watch: this.onWatch.bind(this),
			});
			
			Less.FileManager.prototype.loadFile = function(filename, currentDirectory, options, environment, callback) {
				var compiler = EditorCompiler.getCompiler(options.paths.__compilerId);
				
				if (!compiler) {
					return callback(new Error('Compiler crashed.'));
				}
				
				var extension = Utils.path.extension(filename);
				
				if (!extension) {
					filename += '.' + Utils.path.extension(compiler.source[0]);
				}
				
				filename = Utils.path.convert(filename, currentDirectory);
				
				FileManager.getCache(compiler.workspaceId, filename).then(data => {
					callback(null, { contents: data, filename: filename, webInfo: { lastModified: new Date() }});
				}).catch(e => {
					callback(e, { contents: null, filename: filename, webInfo: { lastModified: new Date() }});
				});
			};
		}
		
		destroy() {
			super.destroy();
			
			this.watcher = null;
			EditorCompiler.removeWatcher(this.name);
			
			Less.FileManager.prototype.loadFile = null;
		}
		
		onWatch(workspaceId, obj, session, value) {
			EditorCompiler.addCompiler(this.watcher, this.compilerName, workspaceId, obj, function(compiler) {
				compiler.file = this.onFile.bind(this);
			}.bind(this));
		}
		
		onFile(compiler, path, file) {
			Less.render(file, {
				filename: path,
				compress: typeof compiler.options.compress != 'undefined' ? compiler.options.compress : true,
				paths: {
					__compilerId: compiler.id,
				},
				'async': true,
			}, function(error, output) {
				if (error) {
					compiler.destroy(new Error(
							'%s on <strong>%s:%s</strong> in file <strong>%s</strong>.'.sprintfEscape(error.message, error.line, error.pos, path)
					));
					EditorCompiler.removeCompiler(compiler);
					return;
				}
				
				EditorCompiler.saveOutput(compiler, output.css);
			});
		}
	}

	module.exports = new Extension();
});