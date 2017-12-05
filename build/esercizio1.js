'use strict'

function _toConsumableArray(arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
      arr2[i] = arr[i]
    }
    return arr2
  } else {
    return Array.from(arr)
  }
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function')
  }
}

// Codice1.js
// implementazione modello di blinn phong
// GDD - 2017
// Vertex shader program
var VSHADER_SOURCE =
  '\n  attribute vec4 a_Position;\n  attribute vec4 a_Normal;\n  uniform mat4 u_MvpMatrix;\n  uniform mat4 u_ModelMatrix; // Model matrix\n  uniform mat4 u_NormalMatrix; // Transformation matrix of the normal\n  uniform vec3 u_LightColor; // Light color\n  uniform vec3 u_LightPosition; // Position of the light source\n  uniform vec3 u_AmbientLight; // Ambient light color\n  uniform vec3 u_DiffuseMat; // Diffuse material color\n  uniform vec3 u_SpecularMat; // Specular material color\n  uniform float u_Shininess  ; // Specular material shininess\n  uniform vec3 u_AmbientMat; // Ambient material color\n  uniform vec3 u_CameraPos; // Camera Position\n  varying vec4 v_Color;\n\n  void main() {\n    gl_Position = u_MvpMatrix * a_Position;\n\n    // Calculate a normal to be fit with a model matrix, and make it 1.0 in length\n    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));\n\n    // Calculate world coordinate of vertex\n    vec4 vertexPosition = u_ModelMatrix * a_Position;\n    float d = length(u_LightPosition - vec3(vertexPosition));\n    float atten = 1.0/(0.01 * d*d);\n\n    // Calculate the light direction and make it 1.0 in length\n    vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));\n\n    // The dot product of the light direction and the normal\n    float nDotL = max(dot(lightDirection, normal), 0.0);\n\n    // Calculate the color due to diffuse reflection\n    vec3 diffuse = u_LightColor * u_DiffuseMat * nDotL;\n\n    // Calculate the color due to ambient reflection\n    vec3 ambient = u_AmbientLight * u_AmbientMat;\n    vec3 specular = vec3(0.0,0.0,0.0);\n\n    if(nDotL > 0.0) {\n      // Calculate specular component\n      vec3 h = normalize(normalize(u_CameraPos - vec3(vertexPosition)) + lightDirection);\n      float hDotn  = max(dot(h, normal), 0.0);\n      specular = u_LightColor * u_SpecularMat * pow(hDotn,u_Shininess);\n    }\n\n    // Add the surface colors due to diffuse reflection and ambient reflection\n    v_Color = vec4(atten *(diffuse + specular)  + ambient, 1.0);\n  }\n'

// Fragment shader program
var FSHADER_SOURCE =
  '\n  #ifdef GL_ES\n  precision mediump float;\n  #endif\n  varying vec4 v_Color;\n  void main() {\n    gl_FragColor = v_Color;\n  }\n'

var Sphere = function Sphere(nDiv, radius) {
  _classCallCheck(this, Sphere)

  this.vertices = []
  this.indices = []
  this.normals = []

  // Per disegnare una sfera abbiamo bisogno di nDiv^2 vertici.
  // Il ciclo for più esterno è quello che itera sull'angolo phi, ossia quello che ci fa passare da
  // una circonferenza alla sua consecutiva.
  for (var j = 0; j <= nDiv; j++) {
    // L'angolo phi è compresto tra 0 e Pi
    var phi = j * Math.PI / nDiv

    // Il ciclo for più interno è quello che itera sull'angolo theta, ossia quello che ci fa passare da un vertice
    // al suo successivo sulla stessa circonferenza.
    for (var i = 0; i <= nDiv; i++) {
      // L'angolo theta è compreso tra 0 e 2 * Pi.
      var theta = i * 2 * Math.PI / nDiv

      // Il calcolo delle coordinate di un vertice avviene tramite le equazioni parametriche della sfera.
      var x = Math.cos(phi) * Math.sin(theta)
      var y = Math.sin(phi) * Math.sin(theta)
      var z = Math.cos(theta)

      this.vertices.push(radius * x, radius * y, radius * z)
      this.normals.push(x, y, z)
    }
  }

  // Inizializzazione degli indici, il significato dei cicli for è sempre lo stesso.
  for (var _j = 0; _j < nDiv; _j++) {
    for (var _i = 0; _i < nDiv; _i++) {
      // p1 è un punto su di una circonferenza.
      var p1 = _j * (nDiv + 1) + _i
      // p2 è il punto sulla circonferenza superiore a quella di p1, nella stessa posizione di p1.
      var p2 = p1 + (nDiv + 1)

      // I punti vanno uniti come nel cilindro per formare dei quadrati.
      this.indices.push(p1, p2, p1 + 1)
      this.indices.push(p1 + 1, p2, p2 + 1)
    }
  }
}

var main = function main() {
  // Retrieve <canvas> element
  var canvas = document.getElementById('webgl')

  // Get the rendering context for WebGL
  var gl = getWebGLContext(canvas)
  if (!gl) {
    console.log('Failed to get the rendering context for WebGL')
    return
  }

  // Initialize shaders
  if (!initShaders(gl, VSHADER_SOURCE, FSHADER_SOURCE)) {
    console.log('Failed to intialize shaders.')
    return
  }

  // Set the vertex coordinates, the color and the normal
  var n = initVertexBuffersCube(gl)
  if (n < 0) {
    console.log('Failed to set the vertex information')
    return
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.93, 0.93, 0.93, 1)
  gl.enable(gl.DEPTH_TEST)

  // Get the storage locations of uniform variables and so on
  var u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
  var u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')
  var u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix')
  var u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor')
  var u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition')
  var u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight')
  var u_DiffuseMat = gl.getUniformLocation(gl.program, 'u_DiffuseMat')
  var u_SpecularMat = gl.getUniformLocation(gl.program, 'u_SpecularMat')
  var u_Shininess = gl.getUniformLocation(gl.program, 'u_Shininess')
  var u_AmbientMat = gl.getUniformLocation(gl.program, 'u_AmbientMat')
  var u_CameraPos = gl.getUniformLocation(gl.program, 'u_CameraPos')

  if (
    !u_ModelMatrix ||
    !u_MvpMatrix ||
    !u_NormalMatrix ||
    !u_LightColor ||
    !u_LightPosition ||
    !u_AmbientLight ||
    !u_DiffuseMat ||
    !u_SpecularMat ||
    !u_Shininess ||
    !u_AmbientMat ||
    !u_CameraPos
  ) {
    console.log('Failed to get the storage location')
    return
  }

  // ******************************************************************************************
  // Set the Specular and Diffuse light color
  gl.uniform3f(u_LightColor, 1.0, 1.0, 1.0)
  // Set the light direction (in the world coordinate)
  gl.uniform3f(u_LightPosition, 10.0, 2.0, 12.0)
  // Set the ambient light
  gl.uniform3f(u_AmbientLight, 0.2, 0.2, 0.2)

  // Set the ambient material
  gl.uniform3f(u_AmbientMat, 0.329412, 0.223529, 0.027451)
  // Set the diffuse material
  gl.uniform3f(u_DiffuseMat, 0.780392, 0.780392, 0.113725)
  // Set the specular material
  gl.uniform3f(u_SpecularMat, 0.992157, 0.941176, 0.807843)

  // Set the specular material
  gl.uniform1f(u_Shininess, 0.21794872 * 128)

  // camera position
  var cameraPos = [1, 3, 8]

  // Set the camera position
  gl.uniform3f.apply(gl, [u_CameraPos].concat(cameraPos))

  //********************************************************************************************

  // creo una GUI con dat.gui
  var gui = new dat.GUI()

  // checkbox geometry
  var materiali = { brass: true, emerald: false, bronze: false, jade: false, gold: false }

  var materialData = {
    brass: {
      ambient: [0.329412, 0.223529, 0.027451],
      diffuse: [0.780392, 0.780392, 0.113725],
      specular: [0.992157, 0.941176, 0.807843],
      shiness: 0.21794872,
    },
    emerald: {
      ambient: [0.0215, 0.1745, 0.0215],
      diffuse: [0.07568, 0.61424, 0.07568],
      specular: [0.633, 0.727811, 0.633],
      shiness: 0.6,
    },
    bronze: {
      ambient: [0.2125, 0.1275, 0.054],
      diffuse: [0.714, 0.4284, 0.18144],
      specular: [0.393548, 0.271906, 0.166721],
      shiness: 0.2,
    },
    jade: {
      ambient: [0.135, 0.2225, 0.1575],
      diffuse: [0.54, 0.89, 0.63],
      specular: [0.316228, 0.316228, 0.316228],
      shiness: 0.1,
    },
    gold: {
      ambient: [0.24725, 0.1995, 0.0745],
      diffuse: [0.75164, 0.60648, 0.22648],
      specular: [0.628281, 0.555802, 0.366065],
      shiness: 0.4,
    },
  }

  var setMaterial = function setMaterial(material) {
    // Set the ambient material
    gl.uniform3f.apply(gl, [u_AmbientMat].concat(_toConsumableArray(material.ambient)))
    // Set the diffuse material
    gl.uniform3f.apply(gl, [u_DiffuseMat].concat(_toConsumableArray(material.diffuse)))
    // Set the specular material
    gl.uniform3f.apply(gl, [u_SpecularMat].concat(_toConsumableArray(material.specular)))

    // Set the specular material
    gl.uniform1f(u_Shininess, material.shiness * 128)
  }

  gui.add(materiali, 'brass').onFinishChange(function(value) {
    // Fires when a controller loses focus.
    if (value == true) {
      for (var i in materiali) {
        materiali[i] = false
      }
      materiali.brass = true
      console.log('brass')

      setMaterial(materialData.brass)
    }

    // Iterate over all controllers
    var _iteratorNormalCompletion = true
    var _didIteratorError = false
    var _iteratorError = undefined

    try {
      for (
        var _iterator = gui.__controllers[Symbol.iterator](), _step;
        !(_iteratorNormalCompletion = (_step = _iterator.next()).done);
        _iteratorNormalCompletion = true
      ) {
        var ctrl = _step.value

        ctrl.updateDisplay()
      }
    } catch (err) {
      _didIteratorError = true
      _iteratorError = err
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator.return) {
          _iterator.return()
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError
        }
      }
    }
  })
  gui.add(materiali, 'emerald').onFinishChange(function(value) {
    // Fires when a controller loses focus.
    if (value == true) {
      for (var i in materiali) {
        materiali[i] = false
      }
      materiali.emerald = true
      console.log('emerald')

      setMaterial(materialData.emerald)
    }

    // Iterate over all controllers
    var _iteratorNormalCompletion2 = true
    var _didIteratorError2 = false
    var _iteratorError2 = undefined

    try {
      for (
        var _iterator2 = gui.__controllers[Symbol.iterator](), _step2;
        !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done);
        _iteratorNormalCompletion2 = true
      ) {
        var ctrl = _step2.value

        ctrl.updateDisplay()
      }
    } catch (err) {
      _didIteratorError2 = true
      _iteratorError2 = err
    } finally {
      try {
        if (!_iteratorNormalCompletion2 && _iterator2.return) {
          _iterator2.return()
        }
      } finally {
        if (_didIteratorError2) {
          throw _iteratorError2
        }
      }
    }
  })
  gui.add(materiali, 'bronze').onFinishChange(function(value) {
    // Fires when a controller loses focus.
    if (value == true) {
      for (var i in materiali) {
        materiali[i] = false
      }
      materiali.bronze = true
      console.log('bronze')

      setMaterial(materialData.bronze)
    }

    // Iterate over all controllers
    var _iteratorNormalCompletion3 = true
    var _didIteratorError3 = false
    var _iteratorError3 = undefined

    try {
      for (
        var _iterator3 = gui.__controllers[Symbol.iterator](), _step3;
        !(_iteratorNormalCompletion3 = (_step3 = _iterator3.next()).done);
        _iteratorNormalCompletion3 = true
      ) {
        var ctrl = _step3.value

        ctrl.updateDisplay()
      }
    } catch (err) {
      _didIteratorError3 = true
      _iteratorError3 = err
    } finally {
      try {
        if (!_iteratorNormalCompletion3 && _iterator3.return) {
          _iterator3.return()
        }
      } finally {
        if (_didIteratorError3) {
          throw _iteratorError3
        }
      }
    }
  })
  gui.add(materiali, 'jade').onFinishChange(function(value) {
    // Fires when a controller loses focus.
    if (value == true) {
      for (var i in materiali) {
        materiali[i] = false
      }
      materiali.jade = true
      console.log('jade')

      setMaterial(materialData.jade)
    }

    // Iterate over all controllers
    var _iteratorNormalCompletion4 = true
    var _didIteratorError4 = false
    var _iteratorError4 = undefined

    try {
      for (
        var _iterator4 = gui.__controllers[Symbol.iterator](), _step4;
        !(_iteratorNormalCompletion4 = (_step4 = _iterator4.next()).done);
        _iteratorNormalCompletion4 = true
      ) {
        var ctrl = _step4.value

        ctrl.updateDisplay()
      }
    } catch (err) {
      _didIteratorError4 = true
      _iteratorError4 = err
    } finally {
      try {
        if (!_iteratorNormalCompletion4 && _iterator4.return) {
          _iterator4.return()
        }
      } finally {
        if (_didIteratorError4) {
          throw _iteratorError4
        }
      }
    }
  })
  gui.add(materiali, 'gold').onFinishChange(function(value) {
    // Fires when a controller loses focus.
    if (value == true) {
      for (var i in materiali) {
        materiali[i] = false
      }
      materiali.gold = true
      console.log('gold')

      setMaterial(materialData.gold)
    }

    // Iterate over all controllers
    var _iteratorNormalCompletion5 = true
    var _didIteratorError5 = false
    var _iteratorError5 = undefined

    try {
      for (
        var _iterator5 = gui.__controllers[Symbol.iterator](), _step5;
        !(_iteratorNormalCompletion5 = (_step5 = _iterator5.next()).done);
        _iteratorNormalCompletion5 = true
      ) {
        var ctrl = _step5.value

        ctrl.updateDisplay()
      }
    } catch (err) {
      _didIteratorError5 = true
      _iteratorError5 = err
    } finally {
      try {
        if (!_iteratorNormalCompletion5 && _iterator5.return) {
          _iterator5.return()
        }
      } finally {
        if (_didIteratorError5) {
          throw _iteratorError5
        }
      }
    }
  })

  // Forza i checkbox perchè non vengano deselezionati
  // per evitare lo stato in cui nessuno sia selezionato
  document.querySelectorAll('input[type="checkbox"').forEach(function(el) {
    el.onchange = function(e) {
      if (!e.target.checked) {
        e.target.checked = true
      }
    }
  })

  //*********************************************************************************

  var currentAngle = 0.0 // Current rotation angle
  var vpMatrix = new Matrix4() // View projection matrix

  // Calculate the view projection matrix
  vpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
  vpMatrix.lookAt(cameraPos[0], cameraPos[1], cameraPos[2], 0, 0, 0, 0, 1, 0)

  var modelMatrix = new Matrix4() // Model matrix
  var mvpMatrix = new Matrix4() // Model view projection matrix
  var normalMatrix = new Matrix4() // Transformation matrix for normals

  var tick = function tick() {
    currentAngle = animate(currentAngle) // Update the rotation angle

    // Calculate the model matrix
    modelMatrix.setRotate(currentAngle, 1, 1, 0) // Rotate around the y-axis

    // Pass the model matrix to u_ModelMatrix
    gl.uniformMatrix4fv(u_ModelMatrix, false, modelMatrix.elements)

    mvpMatrix.set(vpMatrix).multiply(modelMatrix)
    // Pass the model view projection matrix to u_MvpMatrix
    gl.uniformMatrix4fv(u_MvpMatrix, false, mvpMatrix.elements)

    // Calculate the matrix to transform the normal based on the model matrix
    normalMatrix.setInverseOf(modelMatrix)
    normalMatrix.transpose()
    // Pass the transformation matrix for normals to u_NormalMatrix
    gl.uniformMatrix4fv(u_NormalMatrix, false, normalMatrix.elements)

    // Clear color and depth buffer
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    // Draw the cube(Note that the 3rd argument is the gl.UNSIGNED_SHORT)
    gl.drawElements(gl.TRIANGLES, n, gl.UNSIGNED_SHORT, 0)

    requestAnimationFrame(tick, canvas) // Request that the browser ?calls tick
  }
  tick()
}

var initVertexBuffersCube = function initVertexBuffersCube(gl) {
  // create the shape
  var shape = new Sphere(100, 1)

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(shape.vertices), gl.FLOAT, 3)) return -1
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(shape.normals), gl.FLOAT, 3)) return -1

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // Write the indices to the buffer object
  var indexBuffer = gl.createBuffer()
  if (!indexBuffer) {
    console.log('Failed to create the buffer object')
    return -1
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW)

  return shape.indices.length
}

var initArrayBuffer = function initArrayBuffer(gl, attribute, data, type, num) {
  // Create a buffer object
  var buffer = gl.createBuffer()
  if (!buffer) {
    console.log('Failed to create the buffer object')
    return false
  }

  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

  // Assign the buffer object to the attribute variable
  var a_attribute = gl.getAttribLocation(gl.program, attribute)
  if (a_attribute < 0) {
    console.log('Failed to get the storage location of ' + attribute)
    return false
  }
  gl.vertexAttribPointer(a_attribute, num, type, false, 0, 0)
  // Enable the assignment of the buffer object to the attribute variable
  gl.enableVertexAttribArray(a_attribute)

  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  return true
}

// Rotation angle (degrees/second)
var ANGLE_STEP = 20.0

// Last time that this function was called
var g_last = Date.now()
function animate(angle) {
  // Calculate the elapsed time
  var now = Date.now()
  var elapsed = now - g_last
  g_last = now

  // Update the current rotation angle (adjusted by the elapsed time)
  var newAngle = angle + ANGLE_STEP * elapsed / 1000.0
  return (newAngle %= 360)
}

main()
