define('background-map', function(require, exports, module){
	var Map = require('map'),
		Image = require('image');

	GameEngine.BackgroundMap = GameEngine.Map.extend({
		tiles: null,
		scroll: {
			x: 0,
			y: 0
		},
		distance: 1,
		repeat: false,
		tilesetName: '',
		foreground: false,
		enabled: true,
		preRender: false,
		preRenderedChunks: null,
		chunkSize: 512,
		debugChunks: false,
		anims: {},
		init: function(tilesize, data, tileset) {
			this.parent(tilesize, data);
			this.setTileset(tileset);
		},
		setTileset: function(tileset) {
			this.tilesetName = tileset instanceof GameEngine.Image ? tileset.path : tileset;
			this.tiles = new GameEngine.Image(this.tilesetName);
			this.preRenderedChunks = null;
		},
		setScreenPos: function(x, y) {
			this.scroll.x = x / this.distance;
			this.scroll.y = y / this.distance;
		},
		preRenderMapToChunks: function() {
			var totalWidth = this.width * this.tilesize * GameEngine.system.scale,
				totalHeight = this.height * this.tilesize * GameEngine.system.scale;
			this.chunkSize = Math.min(Math.max(totalWidth, totalHeight), this.chunkSize);
			var chunkCols = Math.ceil(totalWidth / this.chunkSize),
				chunkRows = Math.ceil(totalHeight / this.chunkSize);
			this.preRenderedChunks = [];
			for (var y = 0; y < chunkRows; y++) {
				this.preRenderedChunks[y] = [];
				for (var x = 0; x < chunkCols; x++) {
					var chunkWidth = (x == chunkCols - 1) ? totalWidth - x * this.chunkSize : this.chunkSize;
					var chunkHeight = (y == chunkRows - 1) ? totalHeight - y * this.chunkSize : this.chunkSize;
					this.preRenderedChunks[y][x] = this.preRenderChunk(x, y, chunkWidth, chunkHeight);
				}
			}
		},
		preRenderChunk: function(cx, cy, w, h) {
			var tw = w / this.tilesize / GameEngine.system.scale + 1,
				th = h / this.tilesize / GameEngine.system.scale + 1;
			var nx = (cx * this.chunkSize / GameEngine.system.scale) % this.tilesize,
				ny = (cy * this.chunkSize / GameEngine.system.scale) % this.tilesize;
			var tx = Math.floor(cx * this.chunkSize / this.tilesize / GameEngine.system.scale),
				ty = Math.floor(cy * this.chunkSize / this.tilesize / GameEngine.system.scale);
			var chunk = GameEngine.$new('canvas');
			chunk.width = w;
			chunk.height = h;
			chunk.retinaResolutionEnabled = false;
			var chunkContext = chunk.getContext('2d');
			GameEngine.System.scaleMode(chunk, chunkContext);
			var screenContext = GameEngine.system.context;
			GameEngine.system.context = chunkContext;
			for (var x = 0; x < tw; x++) {
				for (var y = 0; y < th; y++) {
					if (x + tx < this.width && y + ty < this.height) {
						var tile = this.data[y + ty][x + tx];
						if (tile) {
							this.tiles.drawTile(x * this.tilesize - nx, y * this.tilesize - ny, tile - 1, this.tilesize);
						}
					}
				}
			}
			GameEngine.system.context = screenContext;
			return chunk;
		},
		draw: function() {
			if (!this.tiles.loaded || !this.enabled) {
				return;
			}
			if (this.preRender) {
				this.drawPreRendered();
			} else {
				this.drawTiled();
			}
		},
		drawPreRendered: function() {
			if (!this.preRenderedChunks) {
				this.preRenderMapToChunks();
			}
			var dx = GameEngine.system.getDrawPos(this.scroll.x),
				dy = GameEngine.system.getDrawPos(this.scroll.y);
			if (this.repeat) {
				var w = this.width * this.tilesize * GameEngine.system.scale;
				dx = (dx % w + w) % w;
				var h = this.height * this.tilesize * GameEngine.system.scale;
				dy = (dy % h + h) % h;
			}
			var minChunkX = Math.max(Math.floor(dx / this.chunkSize), 0),
				minChunkY = Math.max(Math.floor(dy / this.chunkSize), 0),
				maxChunkX = Math.ceil((dx + GameEngine.system.realWidth) / this.chunkSize),
				maxChunkY = Math.ceil((dy + GameEngine.system.realHeight) / this.chunkSize),
				maxRealChunkX = this.preRenderedChunks[0].length,
				maxRealChunkY = this.preRenderedChunks.length;
			if (!this.repeat) {
				maxChunkX = Math.min(maxChunkX, maxRealChunkX);
				maxChunkY = Math.min(maxChunkY, maxRealChunkY);
			}
			var nudgeY = 0;
			for (var cy = minChunkY; cy < maxChunkY; cy++) {
				var nudgeX = 0;
				for (var cx = minChunkX; cx < maxChunkX; cx++) {
					var chunk = this.preRenderedChunks[cy % maxRealChunkY][cx % maxRealChunkX];
					var x = -dx + cx * this.chunkSize - nudgeX;
					var y = -dy + cy * this.chunkSize - nudgeY;
					GameEngine.system.context.drawImage(chunk, x, y);
					GameEngine.Image.drawCount++;
					if (this.debugChunks) {
						GameEngine.system.context.strokeStyle = '#f0f';
						GameEngine.system.context.strokeRect(x, y, this.chunkSize, this.chunkSize);
					}
					if (this.repeat && chunk.width < this.chunkSize && x + chunk.width < GameEngine.system.realWidth) {
						nudgeX += this.chunkSize - chunk.width;
						maxChunkX++;
					}
				}
				if (this.repeat && chunk.height < this.chunkSize && y + chunk.height < GameEngine.system.realHeight) {
					nudgeY += this.chunkSize - chunk.height;
					maxChunkY++;
				}
			}
		},
		drawTiled: function() {
			var tile = 0,
				anim = null,
				tileOffsetX = (this.scroll.x / this.tilesize).toInt(),
				tileOffsetY = (this.scroll.y / this.tilesize).toInt(),
				pxOffsetX = this.scroll.x % this.tilesize,
				pxOffsetY = this.scroll.y % this.tilesize,
				pxMinX = -pxOffsetX - this.tilesize,
				pxMinY = -pxOffsetY - this.tilesize,
				pxMaxX = GameEngine.system.width + this.tilesize - pxOffsetX,
				pxMaxY = GameEngine.system.height + this.tilesize - pxOffsetY;
			for (var mapY = -1, pxY = pxMinY; pxY < pxMaxY; mapY++, pxY += this.tilesize) {
				var tileY = mapY + tileOffsetY;
				if (tileY >= this.height || tileY < 0) {
					if (!this.repeat) {
						continue;
					}
					tileY = (tileY % this.height + this.height) % this.height;
				}
				for (var mapX = -1, pxX = pxMinX; pxX < pxMaxX; mapX++, pxX += this.tilesize) {
					var tileX = mapX + tileOffsetX;
					if (tileX >= this.width || tileX < 0) {
						if (!this.repeat) {
							continue;
						}
						tileX = (tileX % this.width + this.width) % this.width;
					}
					if ((tile = this.data[tileY][tileX])) {
						if ((anim = this.anims[tile - 1])) {
							anim.draw(pxX, pxY);
						} else {
							this.tiles.drawTile(pxX, pxY, tile - 1, this.tilesize);
						}
					}
				}
			}
		}
	});

	module.exports = GameEngine.BackgroundMap;
});