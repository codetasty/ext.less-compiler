define(function(require, exports, module) {
	var ExtensionManager = require('code/extensionManager');
	
	var Code = require('code/code');
	var Socket = require('code/socket');
	var Workspace = require('code/workspace');
	var Notification = require('code/notification');
	var Fn = require('code/fn');
	var FileManager = require('code/fileManager');
	
	var Less = require('./less');
	
	var EditorSession = require('modules/editor/ext/session');
	
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
				
				FileManager.getCache(Extension.importWorkspace, toLoad, function(data) {
					callback(null, { contents: data, filename: toLoad, webInfo: { lastModified: new Date() }});
				});
			};
			
			EditorSession.on('save', function(e) {
				if (self._exts.indexOf(e.storage.extension) !== -1) {
					Extension.compile(e.storage.workspaceId, e.storage.path, e.session.data.getValue());
				}
			});
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
				FileManager.getCache(workspaceId, destination, function(data) {
					Extension.compile(workspaceId, destination, data);
				});
				
				return false;
			}
			
			this.importWorkspace = workspaceId;
			this.importPath = path;
			this._underscores = options.underscores || false;
			
			Less.render(doc, {
				filename: path,
				compress: typeof options.compress != 'undefined' ? options.compress : true,
				async: true,
			}, function(e, output) {
				if (e) {
					Notification.open({
						type: 'error',
						title: _('LESS compilation failed.'),
						description: e.message + ' on line ' + e.line
					});
					return false;
				}
				
				FileManager.saveFile(workspaceId, destination, output.css, null);
			});
		}
	});

	module.exports = Extension;
});