define('myhero', function(require, exports, module){
	var Main = require('main'),
		Game = require('game'),
		Font = require('font'),
		Image = require('image'),
		Entity = require('entity'),
		Animation = require('animation'),
		MYHERO_TYPE = {
			TITLE: 0,
			GAME: 1,
			GAMEOVER: 2
		},
		Myhero, Player, Pao;

	Player = Entity.extend({
		animSheet: new GameEngine.AnimationSheet('images/sprit1.png', 100, 100),
		size: {
			x: 10,
			y: 10
		},
		offset: {
			x: 10,
			y: 10
		},
		angle: 0,
		init: function(x, y, settings){
			this.parent(x, y, settings);
			this.addAnim('idle', 60, [0]);
			this.addAnim('run', .1, [0, 1, 2, 3, 4, 5, 6, 7, 0], true);
		},
		draw: function(){
			this.parent();
		},
		update: function(){
			this.parent();
		},
		run: function(){
			this.currentAnim = this.anims.run.rewind();
		}
	});

	Pao = Entity.extend({
		animSheet: new GameEngine.AnimationSheet('images/pao.png', 32 , 32),
		size: {
			x: 120,
			y: 120
		},
		offset: {
			x: 10,
			y: 10
		},
		init: function(x, y, settings){
			this.parent(x, y, settings);
			this.addAnim('idle', 10, [0]);
			this.addAnim('za', 0.5, [0, 1, 2, 0], true);
		},
		za: function(){
			this.currentAnim = this.anims.za.rewind();
		}
	});

	Myhero = Game.extend({
		player: null,
		init: function(){
			this.setTile();
			this.player = this.spawnEntity(Player, 10, 10);
			// this.pao = this.spawnEntity(Pao, 120, 120);
			window.addEventListener('keydown', this.keydown.bind(this), false);
		},
		reset: function(){

		},
		setTile: function(){
			this.reset();
			this.mode = MYHERO_TYPE.TITLE;
		},
		update: function(){
			this.parent();
		},
		draw: function(){
			for(var i = 0; i<this.entities.length;i++){
				this.entities[i].draw();
			}
		},
		keydown: function(event){
			var code = event.which;
			if(code == GameEngine.KEY.LEFT_ARROW){
				console.log('left arrow is hit');
				this.player.run();
			}
			// if(code == GameEngine.KEY.RIGHT_ARROW){
			// 	console.log('right arrow is hit');
			// 	this.pao.za();
			// }
		}
	});

	exports.start = function(){
		Main('#game', Myhero, 60, 360, 360, 1);
	};
});