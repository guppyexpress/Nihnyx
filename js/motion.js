var canvas = document.createElement("canvas");
var width = canvas.width = window.innerWidth * 2;
var height = canvas.height = window.innerHeight * 2;
document.body.appendChild(canvas);
var gl = canvas.getContext('webgl');

var mouse = {x: 0, y: 0};

var numMotionBall = 30;
var MotionBall = [];

for (var i = 0; i < numMotionBall; i++) {
  var radius = Math.random() * 60 + 10;
  MotionBall.push({
    x: Math.random() * (width - 2 * radius) + radius,
    y: Math.random() * (height - 2 * radius) + radius,
    vx: (Math.random() - 0.5) * 3,
    vy: (Math.random() - 0.5) * 3,
    r: radius * 2
  });
}

var vertexShaderSrc = `
attribute vec2 position;

void main() {
// position specifies only x and y.
// We set z to be 0.0, and w to be 1.0
gl_Position = vec4(position, 0.0, 1.0);
}
`;

var fragmentShaderSrc = `
precision highp float;

const float WIDTH = ` + (width >> 0) + `.0;
const float HEIGHT = ` + (height >> 0) + `.0;

uniform vec3 MotionBall[` + numMotionBall + `];

void main(){
float x = gl_FragCoord.x;
float y = gl_FragCoord.y;

float sum = 0.0;
for (int i = 0; i < ` + numMotionBall + `; i++) {
vec3 metaball = MotionBall[i];
float dx = metaball.x - x;
float dy = metaball.y - y;
float radius = metaball.z;

sum += (radius * radius) / (dx * dx + dy * dy);
}

if (sum >= 0.99) {
gl_FragColor = vec4(mix(vec3(x / WIDTH, y / HEIGHT, 1.0), vec3(0, 0, 0), max(0.0, 1.0 - (sum - 0.99) * 100.0)), 1.0);
return;
}

gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); 
}

`;

var vertexShader = compileShader(vertexShaderSrc, gl.VERTEX_SHADER);
var fragmentShader = compileShader(fragmentShaderSrc, gl.FRAGMENT_SHADER);

var program = gl.createProgram();
gl.attachShader(program, vertexShader);
gl.attachShader(program, fragmentShader);
gl.linkProgram(program);
gl.useProgram(program);

var vertexData = new Float32Array([
  -1.0,  1.0, // top left
  -1.0, -1.0, // bottom left
  1.0,  1.0, // top right
  1.0, -1.0, // bottom right
]);
var vertexDataBuffer = gl.createBuffer();
gl.bindBuffer(gl.ARRAY_BUFFER, vertexDataBuffer);
gl.bufferData(gl.ARRAY_BUFFER, vertexData, gl.STATIC_DRAW);

var positionHandle = getAttribLocation(program, 'position');
gl.enableVertexAttribArray(positionHandle);
gl.vertexAttribPointer(positionHandle,
                       2, // position is a vec2
                       gl.FLOAT, // each component is a float
                       gl.FALSE, // don't normalize values
                       2 * 4, // two 4 byte float components per vertex
                       0 // offset into each span of vertex data
                      );

var MotionBallHandle = getUniformLocation(program, 'MotionBall');

loop();
function loop() {
  for (var i = 0; i < numMotionBall; i++) {
    var metaball = MotionBall[i];
    metaball.x += metaball.vx;
    metaball.y += metaball.vy;

    if (metaball.x < metaball.r || metaball.x > width - metaball.r) metaball.vx *= -1;
    if (metaball.y < metaball.r || metaball.y > height - metaball.r) metaball.vy *= -1;
  }

  var dataToSendToGPU = new Float32Array(3 * numMotionBall);
  for (var i = 0; i < numMotionBall; i++) {
    var baseIndex = 3 * i;
    var mb = MotionBall[i];
    dataToSendToGPU[baseIndex + 0] = mb.x;
    dataToSendToGPU[baseIndex + 1] = mb.y;
    dataToSendToGPU[baseIndex + 2] = mb.r;
  }
  gl.uniform3fv(MotionBallHandle, dataToSendToGPU);
  
  //Draw
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 16);

  requestAnimationFrame(loop);
}

function compileShader(shaderSource, shaderType) {
  var shader = gl.createShader(shaderType);
  gl.shaderSource(shader, shaderSource);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    throw "Shader compile failed with: " + gl.getShaderInfoLog(shader);
  }

  return shader;
}

function getUniformLocation(program, name) {
  var uniformLocation = gl.getUniformLocation(program, name);
  if (uniformLocation === -1) {
    throw 'Can not find uniform ' + name + '.';
  }
  return uniformLocation;
}

function getAttribLocation(program, name) {
  var attributeLocation = gl.getAttribLocation(program, name);
  if (attributeLocation === -1) {
    throw 'Can not find attribute ' + name + '.';
  }
  return attributeLocation;
}

canvas.onmousemove = function(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}
//start of multithread
!function() {

	var URL = window.URL || window.webkitURL;
	if(!URL) {
		throw new Error('This browser does not support Blob URLs');
	}

	if(!window.Worker) {
		throw new Error('This browser does not support Web Workers');
	}

	function Multithread(threads) {
		this.threads = Math.max(2, threads | 0);
		this._queue = [];
		this._queueSize = 0;
		this._activeThreads = 0;
		this._debug = {
			start: 0,
			end: 0,
			time: 0
		};
	}

	Multithread.prototype._worker = {
		JSON: function() {
			var /**/name/**/ = (/**/func/**/);
			self.addEventListener('message', function(e) {
				var data = e.data;
				var view = new DataView(data);
				var len = data.byteLength;
				var str = Array(len);
				for(var i=0;i<len;i++) {
					str[i] = String.fromCharCode(view.getUint8(i));
				}
				var args = JSON.parse(str.join(''));
				var value = (/**/name/**/).apply(/**/name/**/, args);
				try {
					data = JSON.stringify(value);
				} catch(e) {
					throw new Error('Parallel function must return JSON serializable response');
				}
				len = typeof(data)==='undefined'?0:data.length;
				var buffer = new ArrayBuffer(len);
				view = new DataView(buffer);
				for(i=0;i<len;i++) {
					view.setUint8(i, data.charCodeAt(i) & 255);
				}
				self.postMessage(buffer, [buffer]);
				self.close();
			})
		},
		Int32: function() {
			var /**/name/**/ = (/**/func/**/);
			self.addEventListener('message', function(e) {
				var data = e.data;
				var view = new DataView(data);
				var len = data.byteLength / 4;
				var arr = Array(len);
				for(var i=0;i<len;i++) {
					arr[i] = view.getInt32(i*4);
				}
				var value = (/**/name/**/).apply(/**/name/**/, arr);
				if(!(value instanceof Array)) { value = [value]; }
				len = value.length;
				var buffer = new ArrayBuffer(len * 4);
				view = new DataView(buffer);
				for(i=0;i<len;i++) {
					view.setInt32(i*4, value[i]);
				}
				self.postMessage(buffer, [buffer]);
				self.close();
			})
		},
		Float64: function() {
			var /**/name/**/ = (/**/func/**/);
			self.addEventListener('message', function(e) {
				var data = e.data;
				var view = new DataView(data);
				var len = data.byteLength / 8;
				var arr = Array(len);
				for(var i=0;i<len;i++) {
					arr[i] = view.getFloat64(i*8);
				}
				var value = (/**/name/**/).apply(/**/name/**/, arr);
				if(!(value instanceof Array)) { value = [value]; }
				len = value.length;
				var buffer = new ArrayBuffer(len * 8);
				view = new DataView(buffer);
				for(i=0;i<len;i++) {
					view.setFloat64(i*8, value[i]);
				}
				self.postMessage(buffer, [buffer]);
				self.close();
			})
		}
	};

	Multithread.prototype._encode = {
		JSON: function(args) {
			try {
				var data = JSON.stringify(args);
			} catch(e) {
				throw new Error('Arguments provided to parallel function must be JSON serializable');
			}
			len = data.length;
			var buffer = new ArrayBuffer(len);
			var view = new DataView(buffer);
			for(var i=0;i<len;i++) {
				view.setUint8(i, data.charCodeAt(i) & 255);
			}
			return buffer;
		},
		Int32: function(args) {
			len = args.length;
			var buffer = new ArrayBuffer(len*4);
			var view = new DataView(buffer);
			for(var i=0;i<len;i++) {
				view.setInt32(i*4, args[i]);
			}
			return buffer;
		},
		Float64: function(args) {
			len = args.length;
			var buffer = new ArrayBuffer(len*8);
			var view = new DataView(buffer);
			for(var i=0;i<len;i++) {
				view.setFloat64(i*8, args[i]);
			}
			return buffer;
		}
	};

	Multithread.prototype._decode = {
		JSON: function(data) {
			var view = new DataView(data);
			var len = data.byteLength;
			var str = Array(len);
			for(var i=0;i<len;i++) {
				str[i] = String.fromCharCode(view.getUint8(i));
			}
			if(!str.length) {
				return;
			} else {
				return JSON.parse(str.join(''));
			}
		},
		Int32: function(data) {
			var view = new DataView(data);
			var len = data.byteLength / 4;
			var arr = Array(len);
			for(var i=0;i<len;i++) {
				arr[i] = view.getInt32(i*4);
			}
			return arr;
		},
		Float64: function(data) {
			var view = new DataView(data);
			var len = data.byteLength / 8;
			var arr = Array(len);
			for(var i=0;i<len;i++) {
				arr[i] = view.getFloat64(i*8);
			}
			return arr;
		},
	};

	Multithread.prototype._execute = function(resource, args, type, callback) {
		if(!this._activeThreads) {
			this._debug.start = (new Date).valueOf();
		}
		if(this._activeThreads < this.threads) {
			this._activeThreads++;
			var t = (new Date()).valueOf();
			var worker = new Worker(resource);
			var buffer = this._encode[type](args);
			var decode = this._decode[type];
			var self = this;
			if(type==='JSON') {
				var listener = function(e) {
					callback.call(self, decode(e.data));
					self.ready();
				};
			} else {
				var listener = function(e) {
					callback.apply(self, decode(e.data));
					self.ready();
				};
			}
			worker.addEventListener('message', listener);
			worker.postMessage(buffer, [buffer]);
		} else {
			this._queueSize++;
			this._queue.push([resource, args, type, callback]);
		}
	};

	Multithread.prototype.ready = function() {
		this._activeThreads--;
		if(this._queueSize) {
			this._execute.apply(this, this._queue.shift());
			this._queueSize--;
		} else if(!this._activeThreads) {
			this._debug.end = (new Date).valueOf();
			this._debug.time = this._debug.end - this._debug.start;
		}
	};

	Multithread.prototype._prepare = function(fn, type) {

		fn = fn;

		var name = fn.name;
		var fnStr = fn.toString();
		if(!name) {
			name = '$' + ((Math.random()*10)|0);
			while (fnStr.indexOf(name) !== -1) {
				name += ((Math.random()*10)|0);
			}
		}

		var script = this._worker[type]
			.toString()
			.replace(/^.*?[\n\r]+/gi, '')
			.replace(/\}[\s]*$/, '')
			.replace(/\/\*\*\/name\/\*\*\//gi, name)
			.replace(/\/\*\*\/func\/\*\*\//gi, fnStr);

		var resource = URL.createObjectURL(new Blob([script], {type: 'text/javascript'}));

		return resource;

	};

	Multithread.prototype.process = function(fn, callback) {

		var resource = this._prepare(fn, 'JSON');
		var self = this;

		return function() {
			self._execute(resource, [].slice.call(arguments), 'JSON', callback)
		};

	};

	Multithread.prototype.processInt32 = function(fn, callback) {

		var resource = this._prepare(fn, 'Int32');
		var self = this;

		return function() {
			self._execute(resource, [].slice.call(arguments), 'Int32', callback)
		};

	};

	Multithread.prototype.processFloat64 = function(fn, callback) {

		var resource = this._prepare(fn, 'Float64');
		var self = this;

		return function() {
			self._execute(resource, [].slice.call(arguments), 'Float64', callback)
		};

	};

	window['Multithread'] = Multithread;

}();