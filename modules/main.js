define('main', function(require, exports, module){
	var Loader = require('loader'),
		System = require('system'),
		Input = require('input'),
		Sound = require('sound');

	GameEngine.main = function(canvasId, gameClass, fps, width, height, scale, loaderClass) {
		GameEngine.system = new GameEngine.System(canvasId, fps, width, height, scale || 1);
		GameEngine.input = new GameEngine.Input();
		GameEngine.soundManager = new GameEngine.SoundManager();
		GameEngine.music = new GameEngine.Music();
		GameEngine.ready = true;
		var loader = new(loaderClass || GameEngine.Loader)(gameClass, GameEngine.resources);
		loader.load();
	};

	module.exports = GameEngine.main;
});