less = {
	env: "development",
	async: true
};

define(function(require, exports, module) {
	var ExtensionManager = require('core/extensionManager');
	
	var App = require('core/app');
	var Socket = require('core/socket');
	var Workspace = require('core/workspace');
	var Notification = require('core/notification');
	var Fn = require('core/fn');
	var FileManager = require('core/fileManager');
	var Crypto = require('core/crypto');
	
	var Less = require('./less');
	
	var EditorEditors = require('modules/editor/ext/editors');
	
	var Extension = ExtensionManager.register({
		name: 'less-compiler',
		
	}, {
		init: function() {
			var self = this;
			Less.FileManager.prototype.loadFile = function(filename, currentDirectory, options, environment, callback) {
				var ext = Fn.pathinfo(Extension.importPath).extension;
				var reqExt = Fn.pathinfo(filename).extension;
				
				var toLoad = filename;
				
				if (!reqExt) {
					toLoad += '.' + ext;
				}
				
				if (self._underscores) {
					toLoad = toLoad.split('/');
					toLoad[toLoad.length-1] = '_' + toLoad[toLoad.length-1];
					toLoad = toLoad.join('/');
				}
				
				toLoad = FileManager.parsePath(Extension.importPath, toLoad);
				
				FileManager.getCache(Extension.importWorkspace, toLoad, function(data, err) {
					callback(err, { contents: data, filename: toLoad, webInfo: { lastModified: new Date() }});
				});
			};
			
			EditorEditors.on('save', this.onSave);
		},
		destroy: function() {
			EditorEditors.off('save', this.onSave);
		},
		onSave: function(session, value) {
			if (Extension._exts.indexOf(session.storage.extension) !== -1) {
				Extension.compile(session.storage.workspaceId, session.storage.path, value);
			}
		},
		_exts: ['less'],
		_underscores: false,
		importWorkspace: null,
		importPath: '',
		compile: function(workspaceId, path, doc) {
			var self = this;
			var options = FileManager.getFileOptions(doc);
			
			if (!options.out) {
				return false;
			}
			
			var destination = FileManager.parsePath(path, options.out, [this._exts.join('|'), 'css']);
			
			if (!destination) {
				return false;
			}
			
			
			if (destination.match(/\.less$/)) {
				FileManager.getCache(workspaceId, destination, function(data, err) {
					if (err) {
						return Notification.open({
							type: 'error',
							title: 'LESS compilation failed',
							description: err.message,
							autoClose: true
						});
					}
					
					Extension.compile(workspaceId, destination, data);
				});
				
				return false;
			}
			
			this.importWorkspace = workspaceId;
			this.importPath = path;
			this._underscores = options.underscores || false;
			
			var notification;
			
			if (EditorEditors.settings.displayCompilationNotification) {
				notification = Notification.open({
					id: Extension.name + ':' + workspaceId + ':' + destination,
					type: 'default',
					title: 'LESS compilation',
					description: 'Compiling <strong>' + path + '</strong>',
				});
			}
			
			Less.render(doc, {
				filename: path,
				compress: typeof options.compress != 'undefined' ? options.compress : true,
				async: true,
			}, function(error, output) {
				if (error) {
					notification && notification.close();
					
					Notification.open({
						id: Extension.name + ':' + Crypto.sha256(workspaceId + ':' + destination + ':' + error.message),
						type: 'error',
						title: 'LESS compilation failed',
						description: error.message + ' on line ' + error.line,
						autoClose: true
					});
					return false;
				}
				
				if (options.plugin && App.extensions[options.plugin]) {
					App.extensions[options.plugin].plugin(output.css, function(output, error) {
						if (error) {
							notification && notification.close();
							
							Notification.open({
								id: Extension.name + ':' + Crypto.sha256(workspaceId + ':' + destination + ':' + error.message),
								type: 'error',
								title: 'LESS compilation failed (' + options.plugin + ')',
								description: error.message + ' on line ' + error.line,
								autoClose: true
							});
							return false;
						}
						
						FileManager.save({
							id: workspaceId,
							path: destination,
							data: function() {
								notification && notification.close();
							},
							error: function() {
								notification && notification.close();
							}
						}, output);
					});
					
					return false;
				}
				
				FileManager.save({
					id: workspaceId,
					path: destination,
					data: function() {
						notification && notification.close();
					},
					error: function() {
						notification && notification.close();
					}
				}, output.css);
			});
		}
	});

	module.exports = Extension;
});