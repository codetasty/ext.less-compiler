define(function(require, exports, module) {
	var ExtensionManager = require('code/extensionManager');
	
	var Code = require('code/code');
	var Socket = require('code/socket');
	var Workspace = require('code/workspace');
	var Notification = require('code/notification');
	
	var Less = require('./less');
	
	var EditorSession = require('modules/editor/ext/session');
	
	var Extension = ExtensionManager.register({
		name: 'less-compiler',
		
	}, {
		init: function() {
			EditorSession.on('save', function(data) {
				// var sess = EditorSession.sessions[data.id];
				
				if (data.session.extension == 'less') {
					Extension.compile(data.session.workspaceId, data.session.path, data.data.getValue());
				}
			});
		},
		getOptions: function(content) {
			var firstLine = content.substr(0, content.indexOf('\n'));
			var match = /^\s*\/\/\s*(.+)/.exec(firstLine);
			var options = {};

			if (!match) {
				return options;
			}

			match[1].split(',').forEach(function(item) {
				var key, value, i = item.indexOf(':');
				if (i < 0) {
					return;
				}
				key = item.substr(0, i).trim();
				value = item.substr(i + 1).trim();
				if (value.match(/^(true|false|undefined|null|[0-9]+)$/)) {
					value = eval(value);
				}
				options[key] = value;
			});
			return options;
		},
		compile: function(workspaceId, path, doc) {
			var options = this.getOptions(doc);
			
			if (!options.out) {
				return false;
			}
			
			var destination = options.out;
			
			if (destination == '.') {
				destination = path.replace(/less$/, 'css');
			} else if (options.out.substr(0, 1) == '/') {
				destination = options.out;
			} else {
				destination = path.split('/');
				destination.pop();
				destination = destination.join('/');
				destination += '/' + options.out;
			}
			
			destination = destination.replace(/\/\.\//gi, '/').split('/');
			
			destination.every(function(val, key) {
				if (val == '..') {
					destination[key] = '';
					var cc = 1;
					while ((key-cc) >= 0 && !destination[key-cc]) {
						cc++;
					}
					
					destination[key-cc] = '';
				}
				
				return true;
			});
			
			destination = destination.join('/').replace(/([\/]+)/gi, '/');
			
			if (!destination) {
				return false;
			}
			
			Less.render(doc, {
				filename: path,
				compress: typeof options.compress != 'undefined' ? options.compress : true
			}, function(e, output) {
				if (e) {
					Notification.open({
						type: 'error',
						title: _('LESS compilation failed.'),
						description: e.message + ' on line ' + e.line
					});
					return false;
				}
				
				Socket.send('workspace.action', {
					id: workspaceId,
					path: destination,
					action: 'save',
					revisions: false
				}, new Blob([output.css], {type: 'text'}));
			});
		}
	});

	module.exports = Extension;
});