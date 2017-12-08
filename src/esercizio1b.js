// esercizio 1b
// Vertex shader program
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_ModelMatrix;
  uniform mat4 u_NormalMatrix;

  varying vec3  v_vertexPosition;
  varying vec3  v_normal;

  void main() {
    gl_Position = u_MvpMatrix * a_Position;

    // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
    v_normal = normalize(vec3(u_NormalMatrix * a_Normal));

    // Calculate world coordinate of vertex
    v_vertexPosition = vec3(u_ModelMatrix * a_Position);
  }
`

// Fragment shader program
const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif

  varying vec3  v_vertexPosition;
  varying vec3  v_normal;

  uniform vec3  u_LightPosition;
  uniform vec3  u_LightColor;
  uniform vec3  u_DiffuseMat;
  uniform vec3  u_AmbientLight;
  uniform vec3  u_AmbientMat;
  uniform vec3  u_CameraPos;
  uniform vec3  u_SpecularMat;
  uniform float u_Shininess;

  // varying vec3  v_LightPosition;
  // varying vec3  v_vertexPosition;
  // varying vec3  v_normal;
  // varying vec3  v_LightColor;
  // varying vec3  v_DiffuseMat;
  // varying vec3  v_AmbientLight;
  // varying vec3  v_AmbientMat;
  // varying vec3  v_CameraPos;
  // varying vec3  v_SpecularMat;
  // varying float v_Shininess;

  void main() {
    float d = length(u_LightPosition - v_vertexPosition);
    float atten = 1.0 / (0.01 * d*d);

    vec3 lightDirection = normalize(u_LightPosition - v_vertexPosition);
    float nDotL = max(dot(lightDirection, v_normal), 0.0);
    vec3 diffuse = u_LightColor * u_DiffuseMat * nDotL;
    vec3 ambient = u_AmbientLight * u_AmbientMat;
    vec3 specular = vec3(0.0, 0.0, 0.0);

    if (nDotL > 0.0) {
      vec3 h = normalize(normalize(u_CameraPos - v_vertexPosition) + lightDirection);
      float hDotn = max(dot(h, v_normal), 0.0);
      specular = u_LightColor * u_SpecularMat * pow(hDotn, u_Shininess);
    }

    gl_FragColor = vec4(atten * (diffuse + specular) + ambient, 1.0);
  }
`

const cross = (edge1, edge2) => {
  let n = []

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

const getNormal = (v1, v2, v3) => {
  let edge1 = []
  edge1[0] = v2[0] - v1[0]
  edge1[1] = v2[1] - v1[1]
  edge1[2] = v2[2] - v1[2]

  let edge2 = []
  edge2[0] = v3[0] - v1[0]
  edge2[1] = v3[1] - v1[1]
  edge2[2] = v3[2] - v1[2]

  return cross(edge1, edge2)
}

class Cone {
  getVertex(idx) {
    return [this.vertices[3 * idx], this.vertices[3 * idx + 1], this.vertices[3 * idx + 2]]
  }

  updateNormal(idx1, idx2, idx3) {
    let triangle = [this.getVertex(idx1), this.getVertex(idx2), this.getVertex(idx3)]

    triangle.map(v => {
      this.verticesToDraw.push(...v)
    })

    let norm = getNormal(...triangle)
    this.normals.push(...norm, ...norm, ...norm)
  }

  constructor(nDiv, radius, height) {
    this.vertices = []
    this.verticesToDraw = []
    this.normals = []

    const numberVertices = nDiv + 2
    const angleStep = 2 * Math.PI / nDiv
    const centre = [0.0, 0.0, 0.0]
    const top = [0.0, height, 0.0]

    this.vertices.push(...centre)

    this.vertices.push(...top)

    // genero tutti i vertici
    for (let i = 2, angle = 0; i < numberVertices; i++, angle += angleStep) {
      let x = Math.cos(angle) * radius
      let z = Math.sin(angle) * radius
      let y = centre[1]

      this.vertices.push(x, y, z)
    }

    // Ora dobbiamo calcolare le normali e caricare normali e vertici negli array.
    for (let i = 2; i < numberVertices; i++) {
      if (i < numberVertices - 1) {
        // Collego il vertice al suo precedente e al top.
        this.updateNormal(i + 1, i, 1)
        // Collego il vertice al suo successivo e al centro basso.
        this.updateNormal(i, i + 1, 0)
      } else {
        // Nel caso sia l'ultimo vertice allora lo collego col primo sulla circonferenza.
        this.updateNormal(2, i, 1)
        this.updateNormal(i, 2, 0)
      }
    }
  }
}

const main = () => {
  // Retrieve <canvas> element
  const canvas = document.getElementById('webgl')

  // Get the rendering context for WebGL
  const gl = getWebGLContext(canvas)
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
  const n = initVertexBuffers(gl)
  if (n < 0) {
    console.log('Failed to set the vertex information')
    return
  }

  // Set the clear color and enable the depth test
  gl.clearColor(0.93, 0.93, 0.93, 1)
  gl.enable(gl.DEPTH_TEST)

  // Get the storage locations of uniform variables and so on
  const u_ModelMatrix = gl.getUniformLocation(gl.program, 'u_ModelMatrix')
  const u_MvpMatrix = gl.getUniformLocation(gl.program, 'u_MvpMatrix')
  const u_NormalMatrix = gl.getUniformLocation(gl.program, 'u_NormalMatrix')
  const u_LightColor = gl.getUniformLocation(gl.program, 'u_LightColor')
  const u_LightPosition = gl.getUniformLocation(gl.program, 'u_LightPosition')
  const u_AmbientLight = gl.getUniformLocation(gl.program, 'u_AmbientLight')
  const u_DiffuseMat = gl.getUniformLocation(gl.program, 'u_DiffuseMat')
  const u_SpecularMat = gl.getUniformLocation(gl.program, 'u_SpecularMat')
  const u_Shininess = gl.getUniformLocation(gl.program, 'u_Shininess')
  const u_AmbientMat = gl.getUniformLocation(gl.program, 'u_AmbientMat')
  const u_CameraPos = gl.getUniformLocation(gl.program, 'u_CameraPos')

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
  let cameraPos = [1, 3, 8]

  // Set the camera position
  gl.uniform3f(u_CameraPos, ...cameraPos)

  //********************************************************************************************

  // creo una GUI con dat.gui
  const gui = new dat.GUI()

  // checkbox geometry
  const materialData = {
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

  let materiali = {}
  for (let material in materialData) {
    materiali[material] = false
  }
  materiali.brass = true

  const setMaterial = material => {
    // Set the ambient material
    gl.uniform3f(u_AmbientMat, ...material.ambient)
    // Set the diffuse material
    gl.uniform3f(u_DiffuseMat, ...material.diffuse)
    // Set the specular material
    gl.uniform3f(u_SpecularMat, ...material.specular)

    // Set the specular material
    gl.uniform1f(u_Shininess, material.shiness * 128)
  }

  for (let material in materialData) {
    gui.add(materiali, material).onFinishChange(value => {
      if (value === true) {
        for (let i in materiali) materiali[i] = false
        materiali[material] = true
        console.log(`%cMaterial: %c${material}`, 'font-weight: 600', 'font-weight: 400')

        setMaterial(materialData[material])
      }

      // Iterate over all controllers
      for (let ctrl of gui.__controllers) {
        ctrl.updateDisplay()
      }
    })
  }

  // Forza i checkbox perchè non vengano deselezionati
  // per evitare lo stato in cui nessuno sia selezionato
  document.querySelectorAll('input[type="checkbox"').forEach(el => {
    el.onchange = e => {
      if (!e.target.checked) {
        e.target.checked = true
      }
    }
  })

  //*********************************************************************************

  let currentAngle = 0.0 // Current rotation angle
  let vpMatrix = new Matrix4() // View projection matrix

  // Calculate the view projection matrix
  vpMatrix.setPerspective(30, canvas.width / canvas.height, 1, 100)
  vpMatrix.lookAt(cameraPos[0], cameraPos[1], cameraPos[2], 0, 0, 0, 0, 1, 0)

  let modelMatrix = new Matrix4() // Model matrix
  let mvpMatrix = new Matrix4() // Model view projection matrix
  let normalMatrix = new Matrix4() // Transformation matrix for normals

  const tick = () => {
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

const initVertexBuffers = gl => {
  // create the shape
  const shape = new Cone(400, 1, 2)

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(shape.verticesToDraw), gl.FLOAT, 3)) return -1
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(shape.normals), gl.FLOAT, 3)) return -1

  return shape.verticesToDraw.length / 3
}

const initArrayBuffer = (gl, attribute, data, type, num) => {
  // Create a buffer object
  const buffer = gl.createBuffer()
  if (!buffer) {
    console.log('Failed to create the buffer object')
    return false
  }

  // Write date into the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW)

  // Assign the buffer object to the attribute variable
  const a_attribute = gl.getAttribLocation(gl.program, attribute)
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
const ANGLE_STEP = 20.0

// Last time that this function was called
let g_last = Date.now()
function animate(angle) {
  // Calculate the elapsed time
  let now = Date.now()
  let elapsed = now - g_last
  g_last = now

  // Update the current rotation angle (adjusted by the elapsed time)
  let newAngle = angle + ANGLE_STEP * elapsed / 1000.0
  return (newAngle %= 360)
}

main()
