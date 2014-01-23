function Sprite(pos) {
    this._delete  = false;
    this._birth   = (function() { return (new Date()).getTime(); })(); 
    this.pos = pos;
    this.vel = [0, 0];
    this.acc = [0, 0];
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


    this.fps      = 30;
    this.stopped  = false;
    this.canvas   = document.getElementById("main");
    this.width    = this.canvas.width;
    this.height   = this.canvas.height;
    this.keys     = {};
    this.keysDown = {};
    this.sprites  = [];

    var width = this.width;
    var height = this.height;
   
    this._debugMessage = function() {
        return String(this.sprites.length);
    }

    this.draw = function() {
        if (this.canvas.getContext) {
            var ctx = this.canvas.getContext("2d");
            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0 , 0);
            //ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.restore();

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
        
        // Calculate new positions
        for (var i = 0; i < this.sprites.length; i++) {
            this.sprites[i].update(context);
            if (this.sprites[i]._delete)
                this.sprites.splice(i, 1);
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

        if (context.game != this)
            this = context.game;

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


