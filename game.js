function Sprite(pos) {
    this._delete = false;
    this._birth  = (function() { return (new Date()).getTime(); })(); 
    this.pos = pos;
    this.vel = [0, 0];
    this.acc = [0, 0];
    this.size = 0;
    this.visible = true;
    this.__defineGetter__("x", function()  { return this.pos[0]; });
    this.__defineGetter__("y", function()  { return this.pos[1] });
    this.__defineSetter__("x", function(v) { this.pos[0] = v; });
    this.__defineSetter__("y", function(v) { this.pos[1] = v; });
    
    this.__defineGetter__("vx", function()  { return this.vel[0]; });
    this.__defineGetter__("vy", function()  { return this.vel[1] });
    this.__defineSetter__("vx", function(v) { this.vel[0] = v; });
    this.__defineSetter__("vy", function(v) { this.vel[1] = v; });
    
    this.__defineGetter__("ax", function()  { return this.acc[0]; });
    this.__defineGetter__("ay", function()  { return this.acc[1] });
    this.__defineSetter__("ax", function(v) { this.acc[0] = v; });
    this.__defineSetter__("ay", function(v) { this.acc[1] = v; });

    this.updatePos = function(dt) {
        this.vx += this.ax * dt;
        this.vy += this.ay * dt;

        this.x += this.vx * dt;
        this.y += this.vy * dt; 
        

    }

    this.draw = function(ctx) {
        if (this.visible) {
            ctx.save();
            ctx.fillStyle = "black";
            ctx.fillRect(this.x, this.y, 10, 10);
            ctx.moveTo(100, 100);
            ctx.lineTo(200,200);
            ctx.restore();
        }
    }


}

function Game() {
    this._intervalId  = null;
    this._lastTime    = (new Date()).getTime();
    this._currentTime = (new Date()).getTime();
    this._debug       = true;


    this.fps      = 60;
    this.stopped  = false;
    this.canvas   = {
        "main": document.getElementById("main")
    };
    this.width    = this.canvas.main.width;
    this.height   = this.canvas.main.height;
    this.keys     = {};
    this.keysDown = {};
    this.sprites  = [];

    var width = this.width;
    var height = this.height;
   
    this._debugMessage = function() {
        return String(this.sprites.length);
    }

    this.draw = function() {
        if (this.canvas.main.getContext) {
            var ctx = this.canvas.main.getContext("2d");
            
            if (this.hasOwnProperty("drawBackground"))
                this.drawBackground(ctx);

            for (var i = 0; i < this.sprites.length; i++) {
                var s = this.sprites[i];
                s.draw(ctx);
            }

            // Debug stuff
            if (this._debug) {
                ctx.font = "12px Courier";
                ctx.fillStyle = "white";
                ctx.fillText(this._debugMessage(), 10, 15);
            }
        }
    }

    this.controls = function() {
        // Loop through all the sprites to get their controls
        for (var i = 0; i < this.sprites.length; i++) {
            var s = this.sprites[i];
            if (s.controls) {
                for (var k in s.controls) {
                    if (s.controls.hasOwnProperty(k) && 
                        s.controls[k] &&
                        s.controls[k].hasOwnProperty("key") && 
                        s.controls[k].hasOwnProperty("func")) 
                    {
                        this.keys[s.controls[k].key] = {
                            press: s.controls[k].func_press ? s.controls[k].func_press : function() {}, 
                            func: s.controls[k].func,
                            release: s.controls[k].func_release
                        }
                    }
                }
            }
        }

    }
    
    this.handleKeyDown = function(e) {
        this.keysDown[e.keyCode] = (new Date()).getTime();
    }

    this.handleKeyUp = function(e) {
        if (this.keys.hasOwnProperty(e.keyCode)) 
            this.keys[e.keyCode].release();
        delete this.keysDown[e.keyCode];
    }

    this.update = function(context) {
        for (var key in this.keysDown) {
            if (this.keys.hasOwnProperty(key))
                this.keys[key].func(context);
        }
        
        // Calculate new positions & collisions
        for (var i = 0; i < this.sprites.length; i++) {
            var spi = this.sprites[i];
            // Update position
            spi.update(context);
            if (spi._delete)
                this.sprites.splice(i, 1);

            // Don't check for size 0 particles
            if (spi.size <= 0)
                continue;

            // Calculate collisions
            for (var j = 0; j < this.sprites.length; j++) {
                if (j == i)
                    continue;

                var spj = this.sprites[j];

                // Don't check for size 0 particles
                if (spj.size <= 0)
                    continue;

                // Distance squared
                var dist2 = Math.pow(spi.x - spj.x, 2) + Math.pow(spi.y - spj.y, 2);
                // If distance is less than or equal to the summed radii squared 
                // (since we don't take the square root of distance), then we
                // detected a collision
                if (dist2 <= Math.pow(spi.size + spj.size, 2)) {
                    if (spi.hasOwnProperty("collision"))
                        spi.collision(spj);

                    if (spj.hasOwnProperty("collision"))
                        spj.collision(spi);
                }
                
            }
        }
    }

    this.run = function() {
        this._lastTime    = this._currentTime;
        this._currentTime = (new Date()).getTime();

        var context = {
            dt: this._currentTime - this._lastTime,
            time: this._currentTime,
            game: this
        };

        this.update(context);

        //if (context.game != this)
        //    this = context.game;

        this.draw();
    }

    this.start = function() {
        this._intervalId = setInterval(
            (function(self) {
                return function() {
                    self.run();
                }
            })(this), 
            1000 / this.fps
        );

        // Set up keys
        this.controls();

        document.addEventListener("keydown", 
            (function(self) {
                return function(e) {
                    self.handleKeyDown(e);
                }
            })(this));

        document.addEventListener("keyup", 
            (function(self) {
               return function(e) {
                   self.handleKeyUp(e);
               }
            })(this)); 

        }

    this.stop = function() {
        this.stopped = true;
        clearInterval(this._intervalId);
    }
}


