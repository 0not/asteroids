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
                    2000
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
    // Hardcoded size, needed for collisions. Comment out for invincible ship
    this.size = 12;   

    this.vel_rot = 0;
    this.acc_rot = 0;

    this.thrusters = {
        main: 0.1,
        turn: 0.006
    };

    // Insta-death on collision!
    this.collision = function () {
        this.pos = [window.innerWidth/2, window.innerHeight/2];
        this.rot = 0;
        this.vel_rot = 0;
        this.acc_rot = 0;
        this.vel = [0, 0];
        this.acc = [0, 0];
    }

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
        // Increase rate of fire
        decrease_cooldown: {
            key: "L".charCodeAt(0),
            func: (function(self) {
                return function() {
                    if (self.weapons[0].cooldown > 5) {
                        self.weapons[0].cooldown--;
                    }
                }
            })(this),
            func_release: (function(self) {})(this)
        },
        // Decrease rate of fire
        increase_cooldown: {
            key: "K".charCodeAt(0),
            func: (function(self) {
                return function() {
                    if (self.weapons[0].cooldown < 10000) {
                        self.weapons[0].cooldown++;
                    }
                }
            })(this),
            func_release: (function(self) {})(this)
        },
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

    this.collision = function(sprite) {
        this._delete = true;
    };

}

// Inherit from Sprite()
Particle.prototype = new Sprite();
Particle.prototype.constructor = Particle;

// Asteroids
function Asteroid(position, velocity, size) {
    this.pos  = position;
    this.vel  = velocity;
    this.size = size;          // "Radius"
    this.mass = 100 * size;

    this.visible  = true;

    this.draw = function(ctx) {
        if (this.visible) {
            ctx.beginPath();
            ctx.strokeStyle = "white";
            ctx.arc(this.x, this.y, this.size, 0, 2*Math.PI);
            ctx.stroke();
        }
    }

    this.update = function(context) {
        this.updatePos(context.dt);
        
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

    this.collision = function(sprite) {
        // For now, asteroids don't collide
        if (sprite.constructor.name == "Asteroid" ||
            sprite.constructor.name == "Ship") {
            return;
        }

        this.size -= 1;
        // Delete ahead
        if (this.size - 1 <= 0)
            this._delete = true;
    };
}

// Inherit from Sprite()
Asteroid.prototype = new Sprite();
Asteroid.prototype.constructor = Asteroid;

function Map() {
    
}

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
for (var i = 0; i < 10; i++) {
    pts.push(
        new Asteroid(
            [Math.round(Math.random() * window.innerWidth), Math.round(Math.random() * window.innerWidth)], 
            [(Math.random() - 0.5)*0.1, (Math.random() - 0.5)*0.1], 
            Math.random()*50
        )
    );
}
//pts.push(new Particle([300, 300], 1, "#FF6A00", 5000));
//pts[0].vy = -0.1;
window.onresize = function() {
    var c    = document.getElementById("main");
    c.width  = window.innerWidth;
    c.height = window.innerHeight;    
    var d    = document.getElementById("dust");
    d.width  = window.innerWidth;
    d.height = window.innerHeight;
}

window.onload = function() {
    // Force calculation of correct parameters
    window.onresize();
    // Make new game object
    var g = new Game();
    
    g.sprites = ships.concat(pts);
    g.canvas.dust = document.getElementById("dust");
    
    g.background = null;
    // Background function
    g.drawBackground = function(ctx) {
        ctx.save();
        var ctx_dust = this.canvas.dust.getContext("2d");
        if (!this.background) {
            ctx.setTransform(1, 0, 0, 1, 0 , 0);
            //ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            ctx.fillStyle = "black";
            ctx.fillRect(0, 0, this.canvas.main.width, this.canvas.main.height);
            
            // Stars
            this.stars = ctx.getImageData(0, 0, this.width, this.height); 
            var density = 50;
            var simplex = new SimplexNoise();
            for (var i = 0; i < this.stars.data.length; i++) {
                var prob = Math.random();
                if (prob < 0.00001) {
                    var gray = 255;
                    this.stars.data[i]   = gray;
                    this.stars.data[++i] = gray;
                    this.stars.data[++i] = gray;
                    this.stars.data[++i] = 255;
                }
                
            
            }
            
            var width  = this.canvas.dust.width,
                height = this.canvas.dust.height;
                

            this.background = ctx.getImageData(0, 0, width, height);

            for (var x = 0; x < width; x++) {
                for (var y = 0; y < height; y++) {
                    var g = simplex.noise2D(x/256, y/256) * 0.5 + 0.5;
                    this.background.data[(y * width + x) * 4 + 0] = g * 255;
                    this.background.data[(y * width + x) * 4 + 1] = g * 255;
                    this.background.data[(y * width + x) * 4 + 2] = g * 255;
                    this.background.data[(y * width + x) * 4 + 3] = 255;
                }
            }
        }
        ctx.putImageData(this.stars, 0, 0);
        ctx_dust.putImageData(this.background, 0, 0);

        ctx.restore();
        
    }
    g.start();
};




////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////////////////////




/*
 * A fast javascript implementation of simplex noise by Jonas Wagner
 *
 * Based on a speed-improved simplex noise algorithm for 2D, 3D and 4D in Java.
 * Which is based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * With Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * Better rank ordering method by Stefan Gustavson in 2012.
 *
 *
 * Copyright (C) 2012 Jonas Wagner
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 */
(function () {

var F2 = 0.5 * (Math.sqrt(3.0) - 1.0),
    G2 = (3.0 - Math.sqrt(3.0)) / 6.0,
    F3 = 1.0 / 3.0,
    G3 = 1.0 / 6.0,
    F4 = (Math.sqrt(5.0) - 1.0) / 4.0,
    G4 = (5.0 - Math.sqrt(5.0)) / 20.0;


function SimplexNoise(random) {
    if (!random) random = Math.random;
    this.p = new Uint8Array(256);
    this.perm = new Uint8Array(512);
    this.permMod12 = new Uint8Array(512);
    for (var i = 0; i < 256; i++) {
        this.p[i] = random() * 256;
    }
    for (i = 0; i < 512; i++) {
        this.perm[i] = this.p[i & 255];
        this.permMod12[i] = this.perm[i] % 12;
    }

}
SimplexNoise.prototype = {
    grad3: new Float32Array([1, 1, 0,
                            - 1, 1, 0,
                            1, - 1, 0,

                            - 1, - 1, 0,
                            1, 0, 1,
                            - 1, 0, 1,

                            1, 0, - 1,
                            - 1, 0, - 1,
                            0, 1, 1,

                            0, - 1, 1,
                            0, 1, - 1,
                            0, - 1, - 1]),
    grad4: new Float32Array([0, 1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1,
                            0, - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1,
                            1, 0, 1, 1, 1, 0, 1, - 1, 1, 0, - 1, 1, 1, 0, - 1, - 1,
                            - 1, 0, 1, 1, - 1, 0, 1, - 1, - 1, 0, - 1, 1, - 1, 0, - 1, - 1,
                            1, 1, 0, 1, 1, 1, 0, - 1, 1, - 1, 0, 1, 1, - 1, 0, - 1,
                            - 1, 1, 0, 1, - 1, 1, 0, - 1, - 1, - 1, 0, 1, - 1, - 1, 0, - 1,
                            1, 1, 1, 0, 1, 1, - 1, 0, 1, - 1, 1, 0, 1, - 1, - 1, 0,
                            - 1, 1, 1, 0, - 1, 1, - 1, 0, - 1, - 1, 1, 0, - 1, - 1, - 1, 0]),
    noise2D: function (xin, yin) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad3 = this.grad3;
        var n0=0, n1=0, n2=0; // Noise contributions from the three corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin) * F2; // Hairy factor for 2D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var t = (i + j) * G2;
        var X0 = i - t; // Unskew the cell origin back to (x,y) space
        var Y0 = j - t;
        var x0 = xin - X0; // The x,y distances from the cell origin
        var y0 = yin - Y0;
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        var i1, j1; // Offsets for second (middle) corner of simplex in (i,j) coords
        if (x0 > y0) {
            i1 = 1;
            j1 = 0;
        } // lower triangle, XY order: (0,0)->(1,0)->(1,1)
        else {
            i1 = 0;
            j1 = 1;
        } // upper triangle, YX order: (0,0)->(0,1)->(1,1)
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where
        // c = (3-sqrt(3))/6
        var x1 = x0 - i1 + G2; // Offsets for middle corner in (x,y) unskewed coords
        var y1 = y0 - j1 + G2;
        var x2 = x0 - 1.0 + 2.0 * G2; // Offsets for last corner in (x,y) unskewed coords
        var y2 = y0 - 1.0 + 2.0 * G2;
        // Work out the hashed gradient indices of the three simplex corners
        var ii = i & 255;
        var jj = j & 255;
        // Calculate the contribution from the three corners
        var t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 >= 0) {
            var gi0 = permMod12[ii + perm[jj]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0); // (x,y) of grad3 used for 2D gradient
        }
        var t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 >= 0) {
            var gi1 = permMod12[ii + i1 + perm[jj + j1]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1);
        }
        var t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 >= 0) {
            var gi2 = permMod12[ii + 1 + perm[jj + 1]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1,1].
        return 70.0 * (n0 + n1 + n2);
    },
    // 3D simplex noise
    noise3D: function (xin, yin, zin) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad3 = this.grad3;
        var n0, n1, n2, n3; // Noise contributions from the four corners
        // Skew the input space to determine which simplex cell we're in
        var s = (xin + yin + zin) * F3; // Very nice and simple skew factor for 3D
        var i = Math.floor(xin + s);
        var j = Math.floor(yin + s);
        var k = Math.floor(zin + s);
        var t = (i + j + k) * G3;
        var X0 = i - t; // Unskew the cell origin back to (x,y,z) space
        var Y0 = j - t;
        var Z0 = k - t;
        var x0 = xin - X0; // The x,y,z distances from the cell origin
        var y0 = yin - Y0;
        var z0 = zin - Z0;
        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.
        var i1, j1, k1; // Offsets for second corner of simplex in (i,j,k) coords
        var i2, j2, k2; // Offsets for third corner of simplex in (i,j,k) coords
        if (x0 >= y0) {
            if (y0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // X Y Z order
            else if (x0 >= z0) {
                i1 = 1;
                j1 = 0;
                k1 = 0;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // X Z Y order
            else {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 1;
                j2 = 0;
                k2 = 1;
            } // Z X Y order
        }
        else { // x0<y0
            if (y0 < z0) {
                i1 = 0;
                j1 = 0;
                k1 = 1;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Z Y X order
            else if (x0 < z0) {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 0;
                j2 = 1;
                k2 = 1;
            } // Y Z X order
            else {
                i1 = 0;
                j1 = 1;
                k1 = 0;
                i2 = 1;
                j2 = 1;
                k2 = 0;
            } // Y X Z order
        }
        // A step of (1,0,0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
        // a step of (0,1,0) in (i,j,k) means a step of (-c,1-c,-c) in (x,y,z), and
        // a step of (0,0,1) in (i,j,k) means a step of (-c,-c,1-c) in (x,y,z), where
        // c = 1/6.
        var x1 = x0 - i1 + G3; // Offsets for second corner in (x,y,z) coords
        var y1 = y0 - j1 + G3;
        var z1 = z0 - k1 + G3;
        var x2 = x0 - i2 + 2.0 * G3; // Offsets for third corner in (x,y,z) coords
        var y2 = y0 - j2 + 2.0 * G3;
        var z2 = z0 - k2 + 2.0 * G3;
        var x3 = x0 - 1.0 + 3.0 * G3; // Offsets for last corner in (x,y,z) coords
        var y3 = y0 - 1.0 + 3.0 * G3;
        var z3 = z0 - 1.0 + 3.0 * G3;
        // Work out the hashed gradient indices of the four simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        // Calculate the contribution from the four corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = permMod12[ii + perm[jj + perm[kk]]] * 3;
            t0 *= t0;
            n0 = t0 * t0 * (grad3[gi0] * x0 + grad3[gi0 + 1] * y0 + grad3[gi0 + 2] * z0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]] * 3;
            t1 *= t1;
            n1 = t1 * t1 * (grad3[gi1] * x1 + grad3[gi1 + 1] * y1 + grad3[gi1 + 2] * z1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]] * 3;
            t2 *= t2;
            n2 = t2 * t2 * (grad3[gi2] * x2 + grad3[gi2 + 1] * y2 + grad3[gi2 + 2] * z2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 < 0) n3 = 0.0;
        else {
            var gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]] * 3;
            t3 *= t3;
            n3 = t3 * t3 * (grad3[gi3] * x3 + grad3[gi3 + 1] * y3 + grad3[gi3 + 2] * z3);
        }
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to stay just inside [-1,1]
        return 32.0 * (n0 + n1 + n2 + n3);
    },
    // 4D simplex noise, better simplex rank ordering method 2012-03-09
    noise4D: function (x, y, z, w) {
        var permMod12 = this.permMod12,
            perm = this.perm,
            grad4 = this.grad4;

        var n0, n1, n2, n3, n4; // Noise contributions from the five corners
        // Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
        var s = (x + y + z + w) * F4; // Factor for 4D skewing
        var i = Math.floor(x + s);
        var j = Math.floor(y + s);
        var k = Math.floor(z + s);
        var l = Math.floor(w + s);
        var t = (i + j + k + l) * G4; // Factor for 4D unskewing
        var X0 = i - t; // Unskew the cell origin back to (x,y,z,w) space
        var Y0 = j - t;
        var Z0 = k - t;
        var W0 = l - t;
        var x0 = x - X0; // The x,y,z,w distances from the cell origin
        var y0 = y - Y0;
        var z0 = z - Z0;
        var w0 = w - W0;
        // For the 4D case, the simplex is a 4D shape I won't even try to describe.
        // To find out which of the 24 possible simplices we're in, we need to
        // determine the magnitude ordering of x0, y0, z0 and w0.
        // Six pair-wise comparisons are performed between each possible pair
        // of the four coordinates, and the results are used to rank the numbers.
        var rankx = 0;
        var ranky = 0;
        var rankz = 0;
        var rankw = 0;
        if (x0 > y0) rankx++;
        else ranky++;
        if (x0 > z0) rankx++;
        else rankz++;
        if (x0 > w0) rankx++;
        else rankw++;
        if (y0 > z0) ranky++;
        else rankz++;
        if (y0 > w0) ranky++;
        else rankw++;
        if (z0 > w0) rankz++;
        else rankw++;
        var i1, j1, k1, l1; // The integer offsets for the second simplex corner
        var i2, j2, k2, l2; // The integer offsets for the third simplex corner
        var i3, j3, k3, l3; // The integer offsets for the fourth simplex corner
        // simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
        // Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
        // impossible. Only the 24 indices which have non-zero entries make any sense.
        // We use a thresholding to set the coordinates in turn from the largest magnitude.
        // Rank 3 denotes the largest coordinate.
        i1 = rankx >= 3 ? 1 : 0;
        j1 = ranky >= 3 ? 1 : 0;
        k1 = rankz >= 3 ? 1 : 0;
        l1 = rankw >= 3 ? 1 : 0;
        // Rank 2 denotes the second largest coordinate.
        i2 = rankx >= 2 ? 1 : 0;
        j2 = ranky >= 2 ? 1 : 0;
        k2 = rankz >= 2 ? 1 : 0;
        l2 = rankw >= 2 ? 1 : 0;
        // Rank 1 denotes the second smallest coordinate.
        i3 = rankx >= 1 ? 1 : 0;
        j3 = ranky >= 1 ? 1 : 0;
        k3 = rankz >= 1 ? 1 : 0;
        l3 = rankw >= 1 ? 1 : 0;
        // The fifth corner has all coordinate offsets = 1, so no need to compute that.
        var x1 = x0 - i1 + G4; // Offsets for second corner in (x,y,z,w) coords
        var y1 = y0 - j1 + G4;
        var z1 = z0 - k1 + G4;
        var w1 = w0 - l1 + G4;
        var x2 = x0 - i2 + 2.0 * G4; // Offsets for third corner in (x,y,z,w) coords
        var y2 = y0 - j2 + 2.0 * G4;
        var z2 = z0 - k2 + 2.0 * G4;
        var w2 = w0 - l2 + 2.0 * G4;
        var x3 = x0 - i3 + 3.0 * G4; // Offsets for fourth corner in (x,y,z,w) coords
        var y3 = y0 - j3 + 3.0 * G4;
        var z3 = z0 - k3 + 3.0 * G4;
        var w3 = w0 - l3 + 3.0 * G4;
        var x4 = x0 - 1.0 + 4.0 * G4; // Offsets for last corner in (x,y,z,w) coords
        var y4 = y0 - 1.0 + 4.0 * G4;
        var z4 = z0 - 1.0 + 4.0 * G4;
        var w4 = w0 - 1.0 + 4.0 * G4;
        // Work out the hashed gradient indices of the five simplex corners
        var ii = i & 255;
        var jj = j & 255;
        var kk = k & 255;
        var ll = l & 255;
        // Calculate the contribution from the five corners
        var t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0 - w0 * w0;
        if (t0 < 0) n0 = 0.0;
        else {
            var gi0 = (perm[ii + perm[jj + perm[kk + perm[ll]]]] % 32) * 4;
            t0 *= t0;
            n0 = t0 * t0 * (grad4[gi0] * x0 + grad4[gi0 + 1] * y0 + grad4[gi0 + 2] * z0 + grad4[gi0 + 3] * w0);
        }
        var t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1 - w1 * w1;
        if (t1 < 0) n1 = 0.0;
        else {
            var gi1 = (perm[ii + i1 + perm[jj + j1 + perm[kk + k1 + perm[ll + l1]]]] % 32) * 4;
            t1 *= t1;
            n1 = t1 * t1 * (grad4[gi1] * x1 + grad4[gi1 + 1] * y1 + grad4[gi1 + 2] * z1 + grad4[gi1 + 3] * w1);
        }
        var t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2 - w2 * w2;
        if (t2 < 0) n2 = 0.0;
        else {
            var gi2 = (perm[ii + i2 + perm[jj + j2 + perm[kk + k2 + perm[ll + l2]]]] % 32) * 4;
            t2 *= t2;
            n2 = t2 * t2 * (grad4[gi2] * x2 + grad4[gi2 + 1] * y2 + grad4[gi2 + 2] * z2 + grad4[gi2 + 3] * w2);
        }
        var t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3 - w3 * w3;
        if (t3 < 0) n3 = 0.0;
        else {
            var gi3 = (perm[ii + i3 + perm[jj + j3 + perm[kk + k3 + perm[ll + l3]]]] % 32) * 4;
            t3 *= t3;
            n3 = t3 * t3 * (grad4[gi3] * x3 + grad4[gi3 + 1] * y3 + grad4[gi3 + 2] * z3 + grad4[gi3 + 3] * w3);
        }
        var t4 = 0.6 - x4 * x4 - y4 * y4 - z4 * z4 - w4 * w4;
        if (t4 < 0) n4 = 0.0;
        else {
            var gi4 = (perm[ii + 1 + perm[jj + 1 + perm[kk + 1 + perm[ll + 1]]]] % 32) * 4;
            t4 *= t4;
            n4 = t4 * t4 * (grad4[gi4] * x4 + grad4[gi4 + 1] * y4 + grad4[gi4 + 2] * z4 + grad4[gi4 + 3] * w4);
        }
        // Sum up and scale the result to cover the range [-1,1]
        return 27.0 * (n0 + n1 + n2 + n3 + n4);
    }


};

// amd
if (typeof define !== 'undefined' && define.amd) define(function(){return SimplexNoise;});
//common js
if (typeof exports !== 'undefined') exports.SimplexNoise = SimplexNoise;
// browser
else if (typeof navigator !== 'undefined') this.SimplexNoise = SimplexNoise;
// nodejs
if (typeof module !== 'undefined') {
    module.exports = SimplexNoise;
}

})();
