'use strict'

var _createClass = (function() {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i]
      descriptor.enumerable = descriptor.enumerable || false
      descriptor.configurable = true
      if ('value' in descriptor) descriptor.writable = true
      Object.defineProperty(target, descriptor.key, descriptor)
    }
  }
  return function(Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps)
    if (staticProps) defineProperties(Constructor, staticProps)
    return Constructor
  }
})()

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

var normalize = function normalize(v) {
  var norm = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])

  if (norm != 0.0) {
    v[0] /= norm
    v[1] /= norm
    v[2] /= norm
  }

  return v
}

var cross = function cross(edge1, edge2) {
  var n = []

  /* 
   * Nx = UyVz - UzVy
   * Ny = UzVx - UxVz
   * Nz = UxVy - UyVx
   */

  n[0] = edge1[1] * edge2[2] - edge1[2] * edge2[1]
  n[1] = edge1[2] * edge2[0] - edge1[0] * edge2[2]
  n[2] = edge1[0] * edge2[1] - edge1[1] * edge2[0]

  return n
}

var getNormal = function getNormal(v1, v2, v3) {
  var edge1 = []
  edge1[0] = v2[0] - v1[0]
  edge1[1] = v2[1] - v1[1]
  edge1[2] = v2[2] - v1[2]

  var edge2 = []
  edge2[0] = v3[0] - v1[0]
  edge2[1] = v3[1] - v1[1]
  edge2[2] = v3[2] - v1[2]

  return cross(edge1, edge2)
}

var Cone = (function() {
  _createClass(Cone, [
    {
      key: 'getVertex',
      value: function getVertex(idx) {
        return [this.vertices[3 * idx], this.vertices[3 * idx + 1], this.vertices[3 * idx + 2]]
      },
    },
    {
      key: 'updateNormal',
      value: function updateNormal(idx1, idx2, idx3) {
        var _this = this,
          _normals

        var triangle = [this.getVertex(idx1), this.getVertex(idx2), this.getVertex(idx3)]

        triangle.map(function(v) {
          var _verticesToDraw
          ;(_verticesToDraw = _this.verticesToDraw).push.apply(_verticesToDraw, _toConsumableArray(v))
        })

        var norm = getNormal.apply(undefined, triangle)
        ;(_normals = this.normals).push.apply(
          _normals,
          _toConsumableArray(norm).concat(_toConsumableArray(norm), _toConsumableArray(norm))
        )
      },
    },
  ])

  function Cone(nDiv, radius, height) {
    var _vertices, _vertices2

    _classCallCheck(this, Cone)

    this.vertices = []
    this.verticesToDraw = []
    this.normals = []

    var numberVertices = nDiv + 2
    var angleStep = 2 * Math.PI / nDiv
    var centre = [0.0, 0.0, 0.0]
    var top = [0.0, height, 0.0]
    ;(_vertices = this.vertices).push.apply(_vertices, centre)
    ;(_vertices2 = this.vertices).push.apply(_vertices2, top)

    // genero tutti i vertici
    for (var i = 2, angle = 0; i < numberVertices; i++, angle += angleStep) {
      var x = Math.cos(angle) * radius
      var z = Math.sin(angle) * radius
      var y = centre[1]

      this.vertices.push(x, y, z)
    }

    // Ora dobbiamo calcolare le normali e caricare normali e vertici negli array.
    for (var _i = 2; _i < numberVertices; _i++) {
      if (_i < numberVertices - 1) {
        // Collego il vertice al suo precedente e al top.
        this.updateNormal(_i + 1, _i, 1)
        // Collego il vertice al suo successivo e al centro basso.
        this.updateNormal(_i, _i + 1, 0)
      } else {
        // Nel caso sia l'ultimo vertice allora lo collego col primo sulla circonferenza.
        this.updateNormal(2, _i, 1)
        this.updateNormal(_i, 2, 0)
      }
    }
  }

  return Cone
})()

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
  var n = initVertexBuffers(gl)
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
  var materialData = {
    emerald: {
      ambient: [0.0215, 0.1745, 0.0215],
      diffuse: [0.07568, 0.61424, 0.07568],
      specular: [0.633, 0.727811, 0.633],
      shiness: 0.6,
    },
    jade: {
      ambient: [0.135, 0.2225, 0.1575],
      diffuse: [0.54, 0.89, 0.63],
      specular: [0.316228, 0.316228, 0.316228],
      shiness: 0.1,
    },
    obsidian: {
      ambient: [0.05375, 0.05, 0.06625],
      diffuse: [0.18275, 0.17, 0.22525],
      specular: [0.332741, 0.328634, 0.346435],
      shiness: 0.3,
    },
    pearl: {
      ambient: [0.25, 0.20725, 0.20725],
      diffuse: [1, 0.829, 0.829],
      specular: [0.296648, 0.296648, 0.296648],
      shiness: 0.088,
    },
    ruby: {
      ambient: [0.1745, 0.01175, 0.01175],
      diffuse: [0.61424, 0.04126, 0.04136],
      specular: [0.727811, 0.626959, 0.626959],
      shiness: 0.6,
    },
    turquoise: {
      ambient: [0.1, 0.18725, 0.1745],
      diffuse: [0.396, 0.74151, 0.69102],
      specular: [0.297254, 0.30829, 0.306678],
      shiness: 0.1,
    },
    brass: {
      ambient: [0.329412, 0.223529, 0.027451],
      diffuse: [0.780392, 0.780392, 0.113725],
      specular: [0.992157, 0.941176, 0.807843],
      shiness: 0.21794872,
    },
    bronze: {
      ambient: [0.2125, 0.1275, 0.054],
      diffuse: [0.714, 0.4284, 0.18144],
      specular: [0.393548, 0.271906, 0.166721],
      shiness: 0.2,
    },
    chrome: {
      ambient: [0.25, 0.25, 0.25],
      diffuse: [0.4, 0.4, 0.4],
      specular: [0.0774597, 0.0774597, 0.0774597],
      shiness: 0.6,
    },
    copper: {
      ambient: [0.19125, 0.0735, 0.0225],
      diffuse: [0.7038, 0.27048, 0.0828],
      specular: [0.256777, 0.137622, 0.086014],
      shiness: 0.1,
    },
    gold: {
      ambient: [0.24725, 0.1995, 0.0745],
      diffuse: [0.75164, 0.60648, 0.22648],
      specular: [0.628281, 0.555802, 0.366065],
      shiness: 0.4,
    },
    silver: {
      ambient: [0.19225, 0.19225, 0.19225],
      diffuse: [0.50754, 0.50754, 0.50754],
      specular: [0.508273, 0.508273, 0.508273],
      shiness: 0.4,
    },
    blackPlastic: {
      ambient: [0, 0, 0],
      diffuse: [0.01, 0.01, 0.01],
      specular: [0.5, 0.5, 0.5],
      shiness: 0.25,
    },
    cyanPlastic: {
      ambient: [0, 0.1, 0.06],
      diffuse: [0, 0.509804, 0.509804],
      specular: [0.501961, 0.501961, 0.501961],
      shiness: 0.25,
    },
    greenPlastic: {
      ambient: [0, 0, 0],
      diffuse: [0.1, 0.35, 0.1],
      specular: [0.45, 0.55, 0.45],
      shiness: 0.25,
    },
    redPlastic: {
      ambient: [0, 0, 0],
      diffuse: [0.5, 0, 0],
      specular: [0.7, 0.6, 0.6],
      shiness: 0.25,
    },
    whitePlastic: {
      ambient: [0, 0, 0],
      diffuse: [0.55, 0.55, 0.55],
      specular: [0.7, 0.7, 0.7],
      shiness: 0.25,
    },
    yellowPlastic: {
      ambient: [0, 0, 0],
      diffuse: [0.5, 0.5, 0],
      specular: [0.6, 0.6, 0.5],
      shiness: 0.25,
    },
    blackRubber: {
      ambient: [0.02, 0.02, 0.02],
      diffuse: [0.01, 0.01, 0.01],
      specular: [0.4, 0.4, 0.4],
      shiness: 0.078125,
    },
    cyanRubber: {
      ambient: [0, 0.05, 0.05],
      diffuse: [0.4, 0.5, 0.5],
      specular: [0.04, 0.7, 0.7],
      shiness: 0.078125,
    },
    greenRubber: {
      ambient: [0, 0.05, 0],
      diffuse: [0.4, 0.5, 0.4],
      specular: [0.04, 0.7, 0.04],
      shiness: 0.078125,
    },
    redRubber: {
      ambient: [0.05, 0, 0],
      diffuse: [0.5, 0.4, 0.4],
      specular: [0.7, 0.04, 0.04],
      shiness: 0.078125,
    },
    whiteRubber: {
      ambient: [0.05, 0.05, 0.05],
      diffuse: [0.5, 0.5, 0.5],
      specular: [0.7, 0.7, 0.7],
      shiness: 0.078125,
    },
    yellowRubber: {
      ambient: [0.05, 0.05, 0],
      diffuse: [0.5, 0.5, 0.4],
      specular: [0.7, 0.7, 0.04],
      shiness: 0.078125,
    },
  }

  var materiali = {}
  for (var material in materialData) {
    materiali[material] = false
  }
  materiali.brass = true

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

  var _loop = function _loop(_material) {
    gui.add(materiali, _material).onFinishChange(function(value) {
      if (value === true) {
        for (var i in materiali) {
          materiali[i] = false
        }
        materiali[_material] = true
        console.log(_material)

        setMaterial(materialData[_material])
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
  }

  for (var _material in materialData) {
    _loop(_material)
  }

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
    modelMatrix.setRotate(currentAngle, 5, 1, 2) // Rotate around the y-axis

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

    // Draw the shape (Note that the 3rd argument is the gl.UNSIGNED_SHORT)
    gl.drawArrays(gl.TRIANGLES, 0, n)

    requestAnimationFrame(tick, canvas) // Request that the browser ?calls tick
  }
  tick()
}

var initVertexBuffers = function initVertexBuffers(gl) {
  // create the shape
  var shape = new Cone(400, 1, 2)

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(shape.verticesToDraw), gl.FLOAT, 3)) return -1
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(shape.normals), gl.FLOAT, 3)) return -1

  return shape.verticesToDraw.length / 3
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
