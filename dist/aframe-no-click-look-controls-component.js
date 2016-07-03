/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	var PI_2 = Math.PI / 2;
	var TWEEN = __webpack_require__(1);

	AFRAME.registerComponent('no-click-look-controls', {
	  dependencies: ['position', 'rotation'],
	  schema: {
	    enabled: { default: true },
	    maxpitch: {default: PI_2},
	    maxyaw: {default: PI_2 * 6},
	    timebuffer: {default: 0}
	  },

	  /**
	   * Called once when component is attached. Generally for initial setup.
	   */
	  init: function () {
	    var scene = this.el.sceneEl;
	    this.setupMouseControls();
	    this.setupHMDControls();

	    scene.addBehavior(this);
	    this.previousPosition = new THREE.Vector3();
	    this.deltaPosition = new THREE.Vector3();
	  },

	  play: function() {
	        this.attachEventListeners();
	  },

	  tick: function (t) {
	    this.update();
	  },

	  setupMouseControls: function () {
	    this.canvasEl = document.querySelector('a-scene').canvas;
	    // The canvas where the scene is painted
	    this.hovering = false;
	    this.pitchObject = new THREE.Object3D();
	    this.yawObject = new THREE.Object3D();
	    this.yawObject.position.y = 10;
	    this.yawObject.add(this.pitchObject);
	  },

	  setupHMDControls: function () {
	    this.dolly = new THREE.Object3D();
	    this.euler = new THREE.Euler();
	    this.controls = new THREE.VRControls(this.dolly);
	    this.zeroQuaternion = new THREE.Quaternion();

	  },

	  attachEventListeners: function () {
	    var canvasEl = document.querySelector('a-scene').canvas;

	    // Mouse Events
	    canvasEl.addEventListener('mousemove', this.onMouseMove.bind(this), true);
	    canvasEl.addEventListener('mouseout', this.onMouseOut.bind(this), true);
	    canvasEl.addEventListener('mouseover', this.onMouseOver.bind(this), true);
	    // Touch events
	    canvasEl.addEventListener('touchstart', this.onTouchStart.bind(this));
	    canvasEl.addEventListener('touchmove', this.onTouchMove.bind(this));
	    canvasEl.addEventListener('touchend', this.onTouchEnd.bind(this));
	  },

	  update: function () {
	    if (!this.data.enabled) { return; }
	    TWEEN.update();
	    this.controls.update();
	    this.updateOrientation();
	    this.updatePosition();
	  },

	  updateOrientation: (function () {
	    var hmdEuler = new THREE.Euler();
	    hmdEuler.order = 'YXZ';
	    return function () {
	      var pitchObject = this.pitchObject;
	      var yawObject = this.yawObject;
	      var hmdQuaternion = this.calculateHMDQuaternion();
	      hmdEuler.setFromQuaternion(hmdQuaternion);
	      this.el.setAttribute('rotation', {
	        x: THREE.Math.radToDeg(hmdEuler.x) + THREE.Math.radToDeg(pitchObject.rotation.x),
	        y: THREE.Math.radToDeg(hmdEuler.y) + THREE.Math.radToDeg(yawObject.rotation.y),
	        z: THREE.Math.radToDeg(hmdEuler.z)
	      });
	    };
	  })(),

	  calculateHMDQuaternion: (function () {
	    var hmdQuaternion = new THREE.Quaternion();
	    return function () {
	      var dolly = this.dolly;
	      if (!this.zeroed && !dolly.quaternion.equals(this.zeroQuaternion)) {
	        this.zeroOrientation();
	        this.zeroed = true;
	      }
	      hmdQuaternion.copy(this.zeroQuaternion).multiply(dolly.quaternion);
	      return hmdQuaternion;
	    };
	  })(),

	  updatePosition: (function () {
	    var position = new THREE.Vector3();
	    var quaternion = new THREE.Quaternion();
	    var scale = new THREE.Vector3();
	    return function () {
	      var el = this.el;
	      var deltaPosition = this.calculateDeltaPosition();
	      var currentPosition = el.getComputedAttribute('position');
	      this.el.object3D.matrixWorld.decompose(position, quaternion, scale);
	      deltaPosition.applyQuaternion(quaternion);
	      el.setAttribute('position', {
	        x: currentPosition.x + deltaPosition.x,
	        y: currentPosition.y + deltaPosition.y,
	        z: currentPosition.z + deltaPosition.z
	      });
	    };
	  })(),

	  calculateDeltaPosition: function () {
	    var dolly = this.dolly;
	    var deltaPosition = this.deltaPosition;
	    var previousPosition = this.previousPosition;
	    deltaPosition.copy(dolly.position);
	    deltaPosition.sub(previousPosition);
	    previousPosition.copy(dolly.position);
	    return deltaPosition;
	  },

	  updateHMDQuaternion: (function () {
	    var hmdQuaternion = new THREE.Quaternion();
	    return function () {
	      var dolly = this.dolly;
	      this.controls.update();
	      if (!this.zeroed && !dolly.quaternion.equals(this.zeroQuaternion)) {
	        this.zeroOrientation();
	        this.zeroed = true;
	      }
	      hmdQuaternion.copy(this.zeroQuaternion).multiply(dolly.quaternion);
	      return hmdQuaternion;
	    };
	  })(),

	  zeroOrientation: function () {
	    var euler = new THREE.Euler();
	    euler.setFromQuaternion(this.dolly.quaternion.clone().inverse());
	    // Cancel out roll and pitch. We want to only reset yaw
	    euler.z = 0;
	    euler.x = 0;
	    this.zeroQuaternion.setFromEuler(euler);
	  },

	  getMousePosition: function(event, canvasEl) {

	    var rect =  document.querySelector('a-scene').canvas.getBoundingClientRect();

	    // Returns a value from -1 to 1 for X and Y representing the percentage of the max-yaw and max-pitch from the center of the canvas
	    // -1 is far left or top, 1 is far right or bottom
	    return {x: -2*(.5 - (event.clientX - rect.left)/rect.width), y: -2*(.5 - (event.clientY - rect.top)/rect.height)};
	  },

	  onMouseMove: function (event) {
	    var pos = this.getMousePosition(event, this.canvasEl);
	    var x = pos.x;
	    var y = pos.y;

	    TWEEN.removeAll();

	    if (!this.hovering || !this.data.enabled) { return; }

	    var pitchObject = this.pitchObject;
	    var yawObject = this.yawObject;
	    var maxYaw = this.data.maxyaw * -x;
	    var maxPitch = this.data.maxpitch * -y;
	    var coords = { x: pitchObject.rotation.x, y: yawObject.rotation.y };
	    var tween = new TWEEN.Tween(coords)
	      .to({ x: maxPitch, y: maxYaw }, this.data.timebuffer)
	      .onUpdate(function() {
	        yawObject.rotation.y = this.y
	        pitchObject.rotation.x = this.x;
	      })
	    .easing(TWEEN.Easing.Sinusoidal.Out)
	    .start();


	  },

	  onMouseOver: function (event) {
	    this.hovering = true;
	  },

	  onMouseOut: function (event) {
	    this.hovering = false;
	  },

	  onTouchStart: function (e) {
	    if (e.touches.length !== 1) { return; }
	    this.touchStart = {
	      x: e.touches[0].pageX,
	      y: e.touches[0].pageY
	    };
	    this.touchStarted = true;
	  },

	  onTouchMove: function (e) {
	    var deltaY;
	    var yawObject = this.yawObject;
	    if (!this.touchStarted) { return; }
	    deltaY = 2 * Math.PI * (e.touches[0].pageX - this.touchStart.x) / this.canvasEl.clientWidth;
	    // Limits touch orientaion to to yaw (y axis)
	    yawObject.rotation.y -= deltaY * 0.5;
	    this.touchStart = {
	      x: e.touches[0].pageX,
	      y: e.touches[0].pageY
	    };
	  },

	  onTouchEnd: function () {
	    this.touchStarted = false;
	  },
	  /**
	   * Called when a component is removed (e.g., via removeAttribute).
	   * Generally undoes all modifications to the entity.
	   */
	  remove: function () { }
	});

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	var __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/**
	 * Tween.js - Licensed under the MIT license
	 * https://github.com/tweenjs/tween.js
	 * ----------------------------------------------
	 *
	 * See https://github.com/tweenjs/tween.js/graphs/contributors for the full list of contributors.
	 * Thank you all, you're awesome!
	 */

	// Include a performance.now polyfill
	(function () {

		if ('performance' in window === false) {
			window.performance = {};
		}

		// IE 8
		Date.now = (Date.now || function () {
			return new Date().getTime();
		});

		if ('now' in window.performance === false) {
			var offset = window.performance.timing && window.performance.timing.navigationStart ? window.performance.timing.navigationStart
			                                                                                    : Date.now();

			window.performance.now = function () {
				return Date.now() - offset;
			};
		}

	})();

	var TWEEN = TWEEN || (function () {

		var _tweens = [];

		return {

			getAll: function () {

				return _tweens;

			},

			removeAll: function () {

				_tweens = [];

			},

			add: function (tween) {

				_tweens.push(tween);

			},

			remove: function (tween) {

				var i = _tweens.indexOf(tween);

				if (i !== -1) {
					_tweens.splice(i, 1);
				}

			},

			update: function (time) {

				if (_tweens.length === 0) {
					return false;
				}

				var i = 0;

				time = time !== undefined ? time : window.performance.now();

				while (i < _tweens.length) {

					if (_tweens[i].update(time)) {
						i++;
					} else {
						_tweens.splice(i, 1);
					}

				}

				return true;

			}
		};

	})();

	TWEEN.Tween = function (object) {

		var _object = object;
		var _valuesStart = {};
		var _valuesEnd = {};
		var _valuesStartRepeat = {};
		var _duration = 1000;
		var _repeat = 0;
		var _yoyo = false;
		var _isPlaying = false;
		var _reversed = false;
		var _delayTime = 0;
		var _startTime = null;
		var _easingFunction = TWEEN.Easing.Linear.None;
		var _interpolationFunction = TWEEN.Interpolation.Linear;
		var _chainedTweens = [];
		var _onStartCallback = null;
		var _onStartCallbackFired = false;
		var _onUpdateCallback = null;
		var _onCompleteCallback = null;
		var _onStopCallback = null;

		// Set all starting values present on the target object
		for (var field in object) {
			_valuesStart[field] = parseFloat(object[field], 10);
		}

		this.to = function (properties, duration) {

			if (duration !== undefined) {
				_duration = duration;
			}

			_valuesEnd = properties;

			return this;

		};

		this.start = function (time) {

			TWEEN.add(this);

			_isPlaying = true;

			_onStartCallbackFired = false;

			_startTime = time !== undefined ? time : window.performance.now();
			_startTime += _delayTime;

			for (var property in _valuesEnd) {

				// Check if an Array was provided as property value
				if (_valuesEnd[property] instanceof Array) {

					if (_valuesEnd[property].length === 0) {
						continue;
					}

					// Create a local copy of the Array with the start value at the front
					_valuesEnd[property] = [_object[property]].concat(_valuesEnd[property]);

				}

				// If `to()` specifies a property that doesn't exist in the source object,
				// we should not set that property in the object
				if (_valuesStart[property] === undefined) {
					continue;
				}

				_valuesStart[property] = _object[property];

				if ((_valuesStart[property] instanceof Array) === false) {
					_valuesStart[property] *= 1.0; // Ensures we're using numbers, not strings
				}

				_valuesStartRepeat[property] = _valuesStart[property] || 0;

			}

			return this;

		};

		this.stop = function () {

			if (!_isPlaying) {
				return this;
			}

			TWEEN.remove(this);
			_isPlaying = false;

			if (_onStopCallback !== null) {
				_onStopCallback.call(_object);
			}

			this.stopChainedTweens();
			return this;

		};

		this.stopChainedTweens = function () {

			for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
				_chainedTweens[i].stop();
			}

		};

		this.delay = function (amount) {

			_delayTime = amount;
			return this;

		};

		this.repeat = function (times) {

			_repeat = times;
			return this;

		};

		this.yoyo = function (yoyo) {

			_yoyo = yoyo;
			return this;

		};


		this.easing = function (easing) {

			_easingFunction = easing;
			return this;

		};

		this.interpolation = function (interpolation) {

			_interpolationFunction = interpolation;
			return this;

		};

		this.chain = function () {

			_chainedTweens = arguments;
			return this;

		};

		this.onStart = function (callback) {

			_onStartCallback = callback;
			return this;

		};

		this.onUpdate = function (callback) {

			_onUpdateCallback = callback;
			return this;

		};

		this.onComplete = function (callback) {

			_onCompleteCallback = callback;
			return this;

		};

		this.onStop = function (callback) {

			_onStopCallback = callback;
			return this;

		};

		this.update = function (time) {

			var property;
			var elapsed;
			var value;

			if (time < _startTime) {
				return true;
			}

			if (_onStartCallbackFired === false) {

				if (_onStartCallback !== null) {
					_onStartCallback.call(_object);
				}

				_onStartCallbackFired = true;

			}

			elapsed = (time - _startTime) / _duration;
			elapsed = elapsed > 1 ? 1 : elapsed;

			value = _easingFunction(elapsed);

			for (property in _valuesEnd) {

				// Don't update properties that do not exist in the source object
				if (_valuesStart[property] === undefined) {
					continue;
				}

				var start = _valuesStart[property] || 0;
				var end = _valuesEnd[property];

				if (end instanceof Array) {

					_object[property] = _interpolationFunction(end, value);

				} else {

					// Parses relative end values with start as base (e.g.: +10, -3)
					if (typeof (end) === 'string') {

						if (end.startsWith('+') || end.startsWith('-')) {
							end = start + parseFloat(end, 10);
						} else {
							end = parseFloat(end, 10);
						}
					}

					// Protect against non numeric properties.
					if (typeof (end) === 'number') {
						_object[property] = start + (end - start) * value;
					}

				}

			}

			if (_onUpdateCallback !== null) {
				_onUpdateCallback.call(_object, value);
			}

			if (elapsed === 1) {

				if (_repeat > 0) {

					if (isFinite(_repeat)) {
						_repeat--;
					}

					// Reassign starting values, restart by making startTime = now
					for (property in _valuesStartRepeat) {

						if (typeof (_valuesEnd[property]) === 'string') {
							_valuesStartRepeat[property] = _valuesStartRepeat[property] + parseFloat(_valuesEnd[property], 10);
						}

						if (_yoyo) {
							var tmp = _valuesStartRepeat[property];

							_valuesStartRepeat[property] = _valuesEnd[property];
							_valuesEnd[property] = tmp;
						}

						_valuesStart[property] = _valuesStartRepeat[property];

					}

					if (_yoyo) {
						_reversed = !_reversed;
					}

					_startTime = time + _delayTime;

					return true;

				} else {

					if (_onCompleteCallback !== null) {
						_onCompleteCallback.call(_object);
					}

					for (var i = 0, numChainedTweens = _chainedTweens.length; i < numChainedTweens; i++) {
						// Make the chained tweens start exactly at the time they should,
						// even if the `update()` method was called way past the duration of the tween
						_chainedTweens[i].start(_startTime + _duration);
					}

					return false;

				}

			}

			return true;

		};

	};


	TWEEN.Easing = {

		Linear: {

			None: function (k) {

				return k;

			}

		},

		Quadratic: {

			In: function (k) {

				return k * k;

			},

			Out: function (k) {

				return k * (2 - k);

			},

			InOut: function (k) {

				if ((k *= 2) < 1) {
					return 0.5 * k * k;
				}

				return - 0.5 * (--k * (k - 2) - 1);

			}

		},

		Cubic: {

			In: function (k) {

				return k * k * k;

			},

			Out: function (k) {

				return --k * k * k + 1;

			},

			InOut: function (k) {

				if ((k *= 2) < 1) {
					return 0.5 * k * k * k;
				}

				return 0.5 * ((k -= 2) * k * k + 2);

			}

		},

		Quartic: {

			In: function (k) {

				return k * k * k * k;

			},

			Out: function (k) {

				return 1 - (--k * k * k * k);

			},

			InOut: function (k) {

				if ((k *= 2) < 1) {
					return 0.5 * k * k * k * k;
				}

				return - 0.5 * ((k -= 2) * k * k * k - 2);

			}

		},

		Quintic: {

			In: function (k) {

				return k * k * k * k * k;

			},

			Out: function (k) {

				return --k * k * k * k * k + 1;

			},

			InOut: function (k) {

				if ((k *= 2) < 1) {
					return 0.5 * k * k * k * k * k;
				}

				return 0.5 * ((k -= 2) * k * k * k * k + 2);

			}

		},

		Sinusoidal: {

			In: function (k) {

				return 1 - Math.cos(k * Math.PI / 2);

			},

			Out: function (k) {

				return Math.sin(k * Math.PI / 2);

			},

			InOut: function (k) {

				return 0.5 * (1 - Math.cos(Math.PI * k));

			}

		},

		Exponential: {

			In: function (k) {

				return k === 0 ? 0 : Math.pow(1024, k - 1);

			},

			Out: function (k) {

				return k === 1 ? 1 : 1 - Math.pow(2, - 10 * k);

			},

			InOut: function (k) {

				if (k === 0) {
					return 0;
				}

				if (k === 1) {
					return 1;
				}

				if ((k *= 2) < 1) {
					return 0.5 * Math.pow(1024, k - 1);
				}

				return 0.5 * (- Math.pow(2, - 10 * (k - 1)) + 2);

			}

		},

		Circular: {

			In: function (k) {

				return 1 - Math.sqrt(1 - k * k);

			},

			Out: function (k) {

				return Math.sqrt(1 - (--k * k));

			},

			InOut: function (k) {

				if ((k *= 2) < 1) {
					return - 0.5 * (Math.sqrt(1 - k * k) - 1);
				}

				return 0.5 * (Math.sqrt(1 - (k -= 2) * k) + 1);

			}

		},

		Elastic: {

			In: function (k) {

				var s;
				var a = 0.1;
				var p = 0.4;

				if (k === 0) {
					return 0;
				}

				if (k === 1) {
					return 1;
				}

				if (!a || a < 1) {
					a = 1;
					s = p / 4;
				} else {
					s = p * Math.asin(1 / a) / (2 * Math.PI);
				}

				return - (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));

			},

			Out: function (k) {

				var s;
				var a = 0.1;
				var p = 0.4;

				if (k === 0) {
					return 0;
				}

				if (k === 1) {
					return 1;
				}

				if (!a || a < 1) {
					a = 1;
					s = p / 4;
				} else {
					s = p * Math.asin(1 / a) / (2 * Math.PI);
				}

				return (a * Math.pow(2, - 10 * k) * Math.sin((k - s) * (2 * Math.PI) / p) + 1);

			},

			InOut: function (k) {

				var s;
				var a = 0.1;
				var p = 0.4;

				if (k === 0) {
					return 0;
				}

				if (k === 1) {
					return 1;
				}

				if (!a || a < 1) {
					a = 1;
					s = p / 4;
				} else {
					s = p * Math.asin(1 / a) / (2 * Math.PI);
				}

				if ((k *= 2) < 1) {
					return - 0.5 * (a * Math.pow(2, 10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p));
				}

				return a * Math.pow(2, -10 * (k -= 1)) * Math.sin((k - s) * (2 * Math.PI) / p) * 0.5 + 1;

			}

		},

		Back: {

			In: function (k) {

				var s = 1.70158;

				return k * k * ((s + 1) * k - s);

			},

			Out: function (k) {

				var s = 1.70158;

				return --k * k * ((s + 1) * k + s) + 1;

			},

			InOut: function (k) {

				var s = 1.70158 * 1.525;

				if ((k *= 2) < 1) {
					return 0.5 * (k * k * ((s + 1) * k - s));
				}

				return 0.5 * ((k -= 2) * k * ((s + 1) * k + s) + 2);

			}

		},

		Bounce: {

			In: function (k) {

				return 1 - TWEEN.Easing.Bounce.Out(1 - k);

			},

			Out: function (k) {

				if (k < (1 / 2.75)) {
					return 7.5625 * k * k;
				} else if (k < (2 / 2.75)) {
					return 7.5625 * (k -= (1.5 / 2.75)) * k + 0.75;
				} else if (k < (2.5 / 2.75)) {
					return 7.5625 * (k -= (2.25 / 2.75)) * k + 0.9375;
				} else {
					return 7.5625 * (k -= (2.625 / 2.75)) * k + 0.984375;
				}

			},

			InOut: function (k) {

				if (k < 0.5) {
					return TWEEN.Easing.Bounce.In(k * 2) * 0.5;
				}

				return TWEEN.Easing.Bounce.Out(k * 2 - 1) * 0.5 + 0.5;

			}

		}

	};

	TWEEN.Interpolation = {

		Linear: function (v, k) {

			var m = v.length - 1;
			var f = m * k;
			var i = Math.floor(f);
			var fn = TWEEN.Interpolation.Utils.Linear;

			if (k < 0) {
				return fn(v[0], v[1], f);
			}

			if (k > 1) {
				return fn(v[m], v[m - 1], m - f);
			}

			return fn(v[i], v[i + 1 > m ? m : i + 1], f - i);

		},

		Bezier: function (v, k) {

			var b = 0;
			var n = v.length - 1;
			var pw = Math.pow;
			var bn = TWEEN.Interpolation.Utils.Bernstein;

			for (var i = 0; i <= n; i++) {
				b += pw(1 - k, n - i) * pw(k, i) * v[i] * bn(n, i);
			}

			return b;

		},

		CatmullRom: function (v, k) {

			var m = v.length - 1;
			var f = m * k;
			var i = Math.floor(f);
			var fn = TWEEN.Interpolation.Utils.CatmullRom;

			if (v[0] === v[m]) {

				if (k < 0) {
					i = Math.floor(f = m * (1 + k));
				}

				return fn(v[(i - 1 + m) % m], v[i], v[(i + 1) % m], v[(i + 2) % m], f - i);

			} else {

				if (k < 0) {
					return v[0] - (fn(v[0], v[0], v[1], v[1], -f) - v[0]);
				}

				if (k > 1) {
					return v[m] - (fn(v[m], v[m], v[m - 1], v[m - 1], f - m) - v[m]);
				}

				return fn(v[i ? i - 1 : 0], v[i], v[m < i + 1 ? m : i + 1], v[m < i + 2 ? m : i + 2], f - i);

			}

		},

		Utils: {

			Linear: function (p0, p1, t) {

				return (p1 - p0) * t + p0;

			},

			Bernstein: function (n, i) {

				var fc = TWEEN.Interpolation.Utils.Factorial;

				return fc(n) / fc(i) / fc(n - i);

			},

			Factorial: (function () {

				var a = [1];

				return function (n) {

					var s = 1;

					if (a[n]) {
						return a[n];
					}

					for (var i = n; i > 1; i--) {
						s *= i;
					}

					a[n] = s;
					return s;

				};

			})(),

			CatmullRom: function (p0, p1, p2, p3, t) {

				var v0 = (p2 - p0) * 0.5;
				var v1 = (p3 - p1) * 0.5;
				var t2 = t * t;
				var t3 = t * t2;

				return (2 * p1 - 2 * p2 + v0 + v1) * t3 + (- 3 * p1 + 3 * p2 - 2 * v0 - v1) * t2 + v0 * t + p1;

			}

		}

	};

	// UMD (Universal Module Definition)
	(function (root) {

		if (true) {

			// AMD
			!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_RESULT__ = function () {
				return TWEEN;
			}.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__), __WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));

		} else if (typeof module !== 'undefined' && typeof exports === 'object') {

			// Node.js
			module.exports = TWEEN;

		} else if (root !== undefined) {

			// Global variable
			root.TWEEN = TWEEN;

		}

	})(this);


/***/ }
/******/ ]);