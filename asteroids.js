function Weapon(name, cooldown) {
    this.name     = name;
    this.cooldown = 100;
    this.timer    = (new Date()).getTime(),
    this.func_press = function(){}
    this.func = function(ship, context) { 
        if (context.time - this.timer > this.cooldown) {
            context.game.sprites.push(
                new Particle(
                    ship.gunPos(), 
                    [
                        ship.vx+0.3*Math.cos(ship.rot), 
                        ship.vy+0.3*Math.sin(ship.rot)
                    ], 
                    2, 
                    5, 
                    "#FF6A00", 
                    5000
                )
            );
            // Explicitly set birth time,
            // bug in Sprites._birth or something
            context.game.sprites[context.game.sprites.length - 1]._birth = (new Date()).getTime();
            this.timer = context.time;
        }
    }
        
    this.func_release = function() {}
}

function Ship(position, rotation, mass, color) {
    this.pos   = position;
    this.rot   = rotation;
    this.mass  = mass;
    this.color = color;
    
    this.vel_rot = 0;
    this.acc_rot = 0;

    this.thrusters = {
        main: 0.1,
        turn: 0.006
    };

    this.weapons = [new Weapon("Main Cannon", 100)];

    this.visible = true;

    this.shotTimer = (new Date()).getTime();
    this.shotPeriod = 5;

    this.gunPos = function() {
        var angle = this.rot;
        var x = 20, 
            y = 0;

        var xn = x * Math.cos(angle) - y * Math.sin(angle);
        var yn = x * Math.sin(angle) + y * Math.cos(angle);

        return [this.x + xn, this.y + yn];

    }

    // Ship controls
    this.controls = {
        turn_cw: {
            key: "E".charCodeAt(0),
            func: (function(self) {
                return function() {
                    var force = self.thrusters.turn;
                    // Angular acceleration
                    self.acc_rot = force / self.mass;
                }
            })(this),
            func_release: (function(self) {
                return function(context) {
                    self.acc_rot = 0;
                }
            })(this)

        },
        turn_ccw: {
            key: "Q".charCodeAt(0),
            func: (function(self) {
                return function() {
                    var force = -self.thrusters.turn;
                    // Angular acceleration
                    self.acc_rot = force / self.mass;
                }
            })(this),
            func_release: (function(self) {
                return function(context) {
                    self.acc_rot = 0;
                }
            })(this)

        },
        forward: {
            key: "W".charCodeAt(0),
            func: (function(self) {
                return function() {
                    var force = self.thrusters.main;
                    var acc = force / self.mass;
                    self.ax = acc * Math.cos(self.rot);
                    self.ay = acc * Math.sin(self.rot);
                }
            })(this),
            func_release: (function(self) {
                return function(context) {
                    self.ax = 0;
                    self.ay = 0;
                }
            })(this)

        },
        reverse: {
            key: "S".charCodeAt(0),
            func: (function(self) {
                return function() {
                    var force = self.thrusters.main;
                    var acc = -force / self.mass;
                    self.ax = acc * Math.cos(self.rot);
                    self.ay = acc * Math.sin(self.rot);
                }
            })(this),
            func_release: (function(self) {
                return function(context) {
                    self.ax = 0;
                    self.ay = 0;
                }
            })(this)

        },
        right: {
            key: "D".charCodeAt(0),
            func: (function(self) {
                return function() {
                    var force = self.thrusters.main;
                    var acc = -force / self.mass;
                    var angle = (self.rot-Math.PI/2);
                    self.ax = acc * Math.cos(angle);
                    self.ay = acc * Math.sin(angle);
                }
            })(this),
            func_release: (function(self) {
                return function(context) {
                    self.ax = 0;
                    self.ay = 0;
                }
            })(this)

        },
        left: {
            key: "A".charCodeAt(0),
            func: (function(self) {
                return function() {
                    var force = self.thrusters.main;
                    var acc = -force / self.mass;
                    var angle = (self.rot + Math.PI/2);
                    self.ax = acc * Math.cos(angle);
                    self.ay = acc * Math.sin(angle);
                }
            })(this),
            func_release: (function(self) {
                return function(context) {
                    self.ax = 0;
                    self.ay = 0;
                }
            })(this)

        },
        rcs_all:  {
            key: "C".charCodeAt(0),
            func: (function(self) {
                return function(context) {
                    var force = self.thrusters.main;
                    var acc = force / self.mass;
                    var mag = Math.sqrt(Math.pow(self.vx, 2) + Math.pow(self.vy, 2));
                    
                    if (mag != 0) {
                        self.ax = -self.vx / mag * acc;
                        self.ay = -self.vy / mag * acc;
                    }

                    if (self.vel_rot != 0)
                        self.acc_rot = -(self.vel_rot / Math.abs(self.vel_rot)) * self.thrusters.turn / self.mass;
                    //self.acc_rot = -0.1 * self.vel_rot / context.dt;
                }
            })(this),
            func_release: (function(self) {
                return function(context) {
                    self.ax = 0;
                    self.ay = 0;
                    self.acc_rot = 0;
                }
            })(this)
        },
        rcs_velocity:  {
            key: "X".charCodeAt(0),
            func: (function(self) {
                return function(context) {
                    var force = self.thrusters.main;
                    var acc = force / self.mass;
                    var mag = Math.sqrt(Math.pow(self.vx, 2) + Math.pow(self.vy, 2));
                    
                    if (mag != 0) {
                        self.ax = -self.vx / mag * acc;
                        self.ay = -self.vy / mag * acc;
                    }
                }
            })(this),
            func_release: (function(self) {
                return function(context) {
                    self.ax = 0;
                    self.ay = 0;
                }
            })(this)
        },

        rcs_rotation:  {
            key: "R".charCodeAt(0),
            func: (function(self) {
                return function(context) {
                    if (self.vel_rot != 0)
                        self.acc_rot = -(self.vel_rot / Math.abs(self.vel_rot)) * self.thrusters.turn / self.mass;
                }
            })(this),
            func_release: (function(self) {
                return function(context) {
                    self.acc_rot = 0;
                }
            })(this)
        },

        shoot:  {
            key: " ".charCodeAt(0),
            func: 
                (function(self) {
                    return function(context) {
                        self.weapons[0].func(self, context);
                    }
                })(this),
            func_release: (function(self) {
                return function(context) {

                }
            })(this)
        }
    }

    // Vertices of the ship, relative to pos
    this.vertices = [
        [20, 0],
        [-10, 10],
        [-10, -10],
        [20, 0]
    ];

    this.draw = function(ctx) {
        if (this.visible) {
            //ctx.save();
            ctx.strokeStyle = this.color;
            ctx.beginPath();
            ctx.translate(this.x, this.y);
            ctx.rotate(this.rot);
            for (var i = 0; i < this.vertices.length; i++) {
                var x = this.vertices[i][0];
                var y = this.vertices[i][1];

                if (i == 0)
                    ctx.moveTo(x, y);
                else
                    ctx.lineTo(x, y);

            }
            ctx.stroke();
            ctx.rotate(-this.rot);
            ctx.translate(-this.x, -this.y);
            //ctx.restore();
        }
    }

    this.update = function(context) {
        this.updatePos(context.dt);

        this.vel_rot += this.acc_rot * context.dt;
        this.rot += this.vel_rot * context.dt;
        this.rot %= 360; 

        if (this.x < 0 ) {
            this.x = context.game.width;
        }
        if (this.x > context.game.width ) {
            this.x = 0;
        }
        if (this.y < 0 ) {
            this.y = context.game.height;
        }
        if (this.y > context.game.height ) {
            this.y = 0;
        }
        
        //this.acc_rot = 0;
    }

}

// Inherit from Sprite()
Ship.prototype = new Sprite();
Ship.prototype.constructor = Ship;

// MAKE PARTICLES/PROJECTILES
function Particle(position, velocity, size, mass, color, lifetime) {
    this.pos      = position;
    this.vel      = velocity;
    this.size     = size;       // Radius
    this.mass     = mass;
    this.color    = color;
    this.lifetime = lifetime;

    this.visible = true;

    this.draw = function(ctx) {
        if (this.visible) {
            ctx.beginPath();
            ctx.fillStyle = this.color;
            ctx.arc(this.x, this.y, this.size, 0, 2*Math.PI);
            ctx.fill();
        }
    }

    this.update = function(context) {
        this.updatePos(context.dt);
        if (context.time - this._birth > this.lifetime)
            this._delete = true;
        
        if (this.x < 0 ) {
            this.x = context.game.width;
        }
        if (this.x > context.game.width ) {
            this.x = 0;
        }
        if (this.y < 0 ) {
            this.y = context.game.height;
        }
        if (this.y > context.game.height ) {
            this.y = 0;
        }

    }

}

// Inherit from Sprite()
Particle.prototype = new Sprite();
Particle.prototype.constructor = Particle;

var ships = [];
ships.push(
    new Ship(
        [window.innerWidth/2, window.innerHeight/2], 
        0,
        800,
        "white" 
    )
);

//ships[0].rot = -Math.PI/2;

var pts = [];
//pts.push(new Particle([300, 300], 1, "#FF6A00", 5000));
//pts[0].vy = -0.1;
window.onresize = function() {
    var c    = document.getElementById("main");
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
}

window.onload = function() {
    window.onresize();
    // Make new game object
    var g = new Game();
    
    g.sprites = ships.concat(pts);
    
    g.background = null;
    // Background function
    g.drawBackground = function(ctx) {
        ctx.save();
        if (!this.background) {
            ctx.setTransform(1, 0, 0, 1, 0 , 0);
            //ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            // Dust
            this.background = ctx.getImageData(0, 0, this.width, this.height); 
            var density = 50;
            for (var i = 0; i < this.background.data.length; i++) {
                var prob = Math.random();
                if (prob < 0.00001) {
                    var gray = 255;
                    this.background.data[i]   = gray;
                    this.background.data[++i] = gray;
                    this.background.data[++i] = gray;
                    this.background.data[++i] = 255;
                }
                
            }
        }
        ctx.putImageData(this.background, 0, 0);

        ctx.restore();
        
    }
    g.start();
};

