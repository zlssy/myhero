define('timer', function(require, exports, module){
	GameEngine.Timer = GameEngine.Class.extend({
		target: 0,
		base: 0,
		last: 0,
		pausedAt: 0,
		init: function(seconds) {
			this.base = GameEngine.Timer.time;
			this.last = GameEngine.Timer.time;
			this.target = seconds || 0;
		},
		set: function(seconds) {
			this.target = seconds || 0;
			this.base = GameEngine.Timer.time;
			this.pausedAt = 0;
		},
		reset: function() {
			this.base = GameEngine.Timer.time;
			this.pausedAt = 0;
		},
		tick: function() {
			var delta = GameEngine.Timer.time - this.last;
			this.last = GameEngine.Timer.time;
			return (this.pausedAt ? 0 : delta);
		},
		delta: function() {
			return (this.pausedAt || GameEngine.Timer.time) - this.base - this.target;
		},
		pause: function() {
			if (!this.pausedAt) {
				this.pausedAt = GameEngine.Timer.time;
			}
		},
		unpause: function() {
			if (this.pausedAt) {
				this.base += GameEngine.Timer.time - this.pausedAt;
				this.pausedAt = 0;
			}
		}
	});
	GameEngine.Timer._last = 0;
	GameEngine.Timer.time = Number.MIN_VALUE;
	GameEngine.Timer.timeScale = 1;
	GameEngine.Timer.maxStep = 0.05;
	GameEngine.Timer.step = function() {
		var current = Date.now();
		var delta = (current - GameEngine.Timer._last) / 1000;
		GameEngine.Timer.time += Math.min(delta, GameEngine.Timer.maxStep) * GameEngine.Timer.timeScale;
		GameEngine.Timer._last = current;
	};

	module.exports = GameEngine.Timer;
});