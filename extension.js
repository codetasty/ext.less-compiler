less = {
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
	
	var Extension = ExtensionManager.register({
		name: 'less-compiler',
	}, {
		compilerName: 'LESS',
		watcher: null,
		init: function() {
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
				
				FileManager.getCache(compiler.workspaceId, filename, function(data, err) {
					callback(err, { contents: data, filename: filename, webInfo: { lastModified: new Date() }});
				});
			};
		},
		destroy: function() {
			this.watcher = null;
			EditorCompiler.removeWatcher(this.name);
			
			Less.FileManager.prototype.loadFile = null;
		},
		onWatch: function(workspaceId, obj, session, value) {
			EditorCompiler.addCompiler(this.watcher, this.compilerName, workspaceId, obj, function(compiler) {
				compiler.file = this.onFile.bind(this);
			}.bind(this));
		},
		onFile: function(compiler, path, file) {
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
							__('%s on <strong>%s:%s</strong> in file <strong>%s</strong>.', error.message, error.line, error.pos, Utils.path.humanize(path))
					));
					EditorCompiler.removeCompiler(compiler);
					return;
				}
				
				EditorCompiler.saveOutput(compiler, output.css);
			});
		},
	});

	module.exports = Extension;
});