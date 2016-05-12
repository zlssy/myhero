define('loader', function(require, exports, module){
	var Image = require('image'),
		Font = require('font'),
		Sound = require('sound');
		
	GameEngine.Loader = GameEngine.Class.extend({
		resources: [],
		gameClass: null,
		status: 0,
		done: false,
		_unloaded: [],
		_drawStatus: 0,
		_intervalId: 0,
		_loadCallbackBound: null,
		init: function(gameClass, resources) {
			this.gameClass = gameClass;
			this.resources = resources;
			this._loadCallbackBound = this._loadCallback.bind(this);
			for (var i = 0; i < this.resources.length; i++) {
				this._unloaded.push(this.resources[i].path);
			}
		},
		load: function() {
			GameEngine.system.clear('#000');
			if (!this.resources.length) {
				this.end();
				return;
			}
			for (var i = 0; i < this.resources.length; i++) {
				this.loadResource(this.resources[i]);
			}
			this._intervalId = setInterval(this.draw.bind(this), 16);
		},
		loadResource: function(res) {
			res.load(this._loadCallbackBound);
		},
		end: function() {
			if (this.done) {
				return;
			}
			this.done = true;
			clearInterval(this._intervalId);
			GameEngine.system.setGame(this.gameClass);
		},
		draw: function() {
			this._drawStatus += (this.status - this._drawStatus) / 5;
			var s = GameEngine.system.scale;
			var w = GameEngine.system.width * 0.6;
			var h = GameEngine.system.height * 0.1;
			var x = GameEngine.system.width * 0.5 - w / 2;
			var y = GameEngine.system.height * 0.5 - h / 2;
			GameEngine.system.context.fillStyle = '#000';
			GameEngine.system.context.fillRect(0, 0, 480, 320);
			GameEngine.system.context.fillStyle = '#fff';
			GameEngine.system.context.fillRect(x * s, y * s, w * s, h * s);
			GameEngine.system.context.fillStyle = '#000';
			GameEngine.system.context.fillRect(x * s + s, y * s + s, w * s - s - s, h * s - s - s);
			GameEngine.system.context.fillStyle = '#fff';
			GameEngine.system.context.fillRect(x * s, y * s, w * s * this._drawStatus, h * s);
		},
		_loadCallback: function(path, status) {
			if (status) {
				this._unloaded.erase(path);
			} else {
				throw ('Failed to load resource: ' + path);
			}
			this.status = 1 - (this._unloaded.length / this.resources.length);
			if (this._unloaded.length == 0) {
				setTimeout(this.end.bind(this), 250);
			}
		}
	});

	module.exports = GameEngine.Loader;
});