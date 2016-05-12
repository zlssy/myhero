define('system', function(require, exports, module){
	var Image = require('image'),
		Timer = require('timer');

	GameEngine.System = GameEngine.Class.extend({
		fps: 30,
		width: 320,
		height: 240,
		realWidth: 320,
		realHeight: 240,
		scale: 1,
		tick: 0,
		animationId: 0,
		newGameClass: null,
		running: false,
		delegate: null,
		clock: null,
		canvas: null,
		context: null,
		init: function(canvasId, fps, width, height, scale) {
			this.fps = fps;
			this.clock = new GameEngine.Timer();
			this.canvas = GameEngine.$(canvasId);
			this.resize(width, height, scale);
			this.context = this.canvas.getContext('2d');
			this.getDrawPos = GameEngine.System.drawMode;
			if (this.scale != 1) {
				GameEngine.System.scaleMode = GameEngine.System.SCALE.CRISP;
			}
			GameEngine.System.scaleMode(this.canvas, this.context);
		},
		resize: function(width, height, scale) {
			this.width = width;
			this.height = height;
			this.scale = scale || this.scale;
			this.realWidth = this.width * this.scale;
			this.realHeight = this.height * this.scale;
			this.canvas.width = this.realWidth;
			this.canvas.height = this.realHeight;
		},
		setGame: function(gameClass) {
			if (this.running) {
				this.newGameClass = gameClass;
			} else {
				this.setGameNow(gameClass);
			}
		},
		setGameNow: function(gameClass) {
			GameEngine.game = new(gameClass)();
			GameEngine.system.setDelegate(GameEngine.game);
		},
		setDelegate: function(object) {
			if (typeof(object.run) == 'function') {
				this.delegate = object;
				this.startRunLoop();
			} else {
				throw ('System.setDelegate: No run() function in object');
			}
		},
		stopRunLoop: function() {
			GameEngine.clearAnimation(this.animationId);
			this.running = false;
		},
		startRunLoop: function() {
			this.stopRunLoop();
			this.animationId = GameEngine.setAnimation(this.run.bind(this), this.canvas);
			this.running = true;
		},
		clear: function(color) {
			this.context.fillStyle = color;
			this.context.fillRect(0, 0, this.realWidth, this.realHeight);
		},
		run: function() {
			GameEngine.Timer.step();
			this.tick = this.clock.tick();
			this.delegate.run();
			GameEngine.input.clearPressed();
			if (this.newGameClass) {
				this.setGameNow(this.newGameClass);
				this.newGameClass = null;
			}
		},
		getDrawPos: null
	});
	GameEngine.System.DRAW = {
		AUTHENTIC: function(p) {
			return Math.round(p) * this.scale;
		},
		SMOOTH: function(p) {
			return Math.round(p * this.scale);
		},
		SUBPIXEL: function(p) {
			return p * this.scale;
		}
	};
	GameEngine.System.drawMode = GameEngine.System.DRAW.SMOOTH;
	GameEngine.System.SCALE = {
		CRISP: function(canvas, context) {
			GameEngine.setVendorAttribute(context, 'imageSmoothingEnabled', false);
			canvas.style.imageRendering = '-moz-crisp-edges';
			canvas.style.imageRendering = '-o-crisp-edges';
			canvas.style.imageRendering = '-webkit-optimize-contrast';
			canvas.style.imageRendering = 'crisp-edges';
			canvas.style.msInterpolationMode = 'nearest-neighbor';
		},
		SMOOTH: function(canvas, context) {
			GameEngine.setVendorAttribute(context, 'imageSmoothingEnabled', true);
			canvas.style.imageRendering = '';
			canvas.style.msInterpolationMode = '';
		}
	};
	GameEngine.System.scaleMode = GameEngine.System.SCALE.SMOOTH;

	module.exports = GameEngine.System;
});