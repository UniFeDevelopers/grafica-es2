// Codice1.js
// implementazione modello di blinn phong
// GDD - 2017
// Vertex shader program
const VSHADER_SOURCE = `
  attribute vec4 a_Position;
  attribute vec4 a_Normal;
  uniform mat4 u_MvpMatrix;
  uniform mat4 u_ModelMatrix; // Model matrix
  uniform mat4 u_NormalMatrix; // Transformation matrix of the normal
  uniform vec3 u_LightColor; // Light color
  uniform vec3 u_LightPosition; // Position of the light source
  uniform vec3 u_AmbientLight; // Ambient light color
  uniform vec3 u_DiffuseMat; // Diffuse material color
  uniform vec3 u_SpecularMat; // Specular material color
  uniform float u_Shininess  ; // Specular material shininess
  uniform vec3 u_AmbientMat; // Ambient material color
  uniform vec3 u_CameraPos; // Camera Position
  varying vec4 v_Color;

  void main() {
    gl_Position = u_MvpMatrix * a_Position;

    // Calculate a normal to be fit with a model matrix, and make it 1.0 in length
    vec3 normal = normalize(vec3(u_NormalMatrix * a_Normal));

    // Calculate world coordinate of vertex
    vec4 vertexPosition = u_ModelMatrix * a_Position;
    float d = length(u_LightPosition - vec3(vertexPosition));
    float atten = 1.0/(0.01 * d*d);

    // Calculate the light direction and make it 1.0 in length
    vec3 lightDirection = normalize(u_LightPosition - vec3(vertexPosition));

    // The dot product of the light direction and the normal
    float nDotL = max(dot(lightDirection, normal), 0.0);

    // Calculate the color due to diffuse reflection
    vec3 diffuse = u_LightColor * u_DiffuseMat * nDotL;

    // Calculate the color due to ambient reflection
    vec3 ambient = u_AmbientLight * u_AmbientMat;
    vec3 specular = vec3(0.0,0.0,0.0);

    if(nDotL > 0.0) {
      // Calculate specular component
      vec3 h = normalize(normalize(u_CameraPos - vec3(vertexPosition)) + lightDirection);
      float hDotn  = max(dot(h, normal), 0.0);
      specular = u_LightColor * u_SpecularMat * pow(hDotn,u_Shininess);
    }

    // Add the surface colors due to diffuse reflection and ambient reflection
    v_Color = vec4(atten *(diffuse + specular)  + ambient, 1.0);
  }
`

// Fragment shader program
const FSHADER_SOURCE = `
  #ifdef GL_ES
  precision mediump float;
  #endif
  varying vec4 v_Color;
  void main() {
    gl_FragColor = v_Color;
  }
`

function cross(edge1, edge2) {
  let n = []
  /*
  Nx = UyVz - UzVy
  Ny = UzVx - UxVz
  Nz = UxVy - UyVx
  */
  n[0] = edge1[1] * edge2[2] - edge1[2] * edge2[1]
  n[1] = edge1[2] * edge2[0] - edge1[0] * edge2[2]
  n[2] = edge1[0] * edge2[1] - edge1[1] * edge2[0]

  return n
}

function normalize(v) {
  let norm = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2])
  v[0] /= norm
  v[1] /= norm
  v[2] /= norm

  return v
}

function getNormal(v1, v2, v3) {
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

class Sphere {
  getVertex(idx) {
    //Dato un indice ritorna il vertice.
    return [this.vertices[3 * idx], this.vertices[3 * idx + 1], this.vertices[3 * idx + 2]]
  }

  addNormal(idx1, idx2, idx3) {
    //Array di 3 componenti.
    let normal = getNormal(this.getVertex(idx1), this.getVertex(idx2), this.getVertex(idx3))

    this.normals[3 * idx1] += normal[0]
    this.normals[3 * idx1 + 1] += normal[1]
    this.normals[3 * idx1 + 2] += normal[2]

    this.normals[3 * idx2] += normal[0]
    this.normals[3 * idx2 + 1] += normal[1]
    this.normals[3 * idx2 + 2] += normal[2]

    this.normals[3 * idx3] += normal[0]
    this.normals[3 * idx3 + 1] += normal[1]
    this.normals[3 * idx3 + 2] += normal[2]
  }

  constructor(nDiv, radius) {
    this.vertices = []
    this.indices = []
    this.normals = []

    // Per disegnare una sfera abbiamo bisogno di nDiv^2 vertici.
    // Il ciclo for più esterno è quello che itera sull'angolo phi, ossia quello che ci fa passare da
    // una circonferenza alla sua consecutiva.
    for (let j = 0; j <= nDiv; j++) {
      // L'angolo phi è compresto tra 0 e Pi
      let phi = j * Math.PI / nDiv

      // Il ciclo for più interno è quello che itera sull'angolo theta, ossia quello che ci fa passare da un vertice
      // al suo successivo sulla stessa circonferenza.
      for (let i = 0; i <= nDiv; i++) {
        // L'angolo theta è compreso tra 0 e 2 * Pi.
        let theta = i * 2 * Math.PI / nDiv

        // Il calcolo delle coordinate di un vertice avviene tramite le equazioni parametriche della sfera.
        let x = Math.cos(phi) * Math.sin(theta)
        let y = Math.sin(phi) * Math.sin(theta)
        let z = Math.cos(theta)

        this.vertices.push(radius * x, radius * y, radius * z)
        // Inizializzo tutte le normali a 0.
        this.normals.push(0.0, 0.0, 0.0)
      }
    }

    // Inizializzazione degli indici, il significato dei cicli for è sempre lo stesso.
    for (let j = 0; j < nDiv; j++) {
      for (let i = 0; i < nDiv; i++) {
        // p1 è un punto su di una circonferenza.
        let p1 = j * (nDiv + 1) + i
        // p2 è il punto sulla circonferenza superiore a quella di p1, nella stessa posizione di p1.
        let p2 = p1 + (nDiv + 1)

        // I punti vanno uniti come nel cilindro per formare dei quadrati.
        this.indices.push(p1, p2, p1 + 1)
        this.addNormal(p1, p2, p1 + 1)

        this.indices.push(p1 + 1, p2, p2 + 1)
        // Ho cambiato l'ordine per mettere p2 + 1 come punto centrale del triangolo.
        this.addNormal(p2 + 1, p2, p1 + 1)
      }
    }
  }
}

function main() {
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
  const n = initVertexBuffersCube(gl)
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
  let materiali = { brass: true, emerald: false, bronze: false, jade: false, gold: false }

  const materialData = {
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

  gui.add(materiali, 'brass').onFinishChange(function(value) {
    // Fires when a controller loses focus.
    if (value == true) {
      for (let i in materiali) materiali[i] = false
      materiali.brass = true
      console.log('brass')

      setMaterial(materialData.brass)
    }

    // Iterate over all controllers
    for (let ctrl of gui.__controllers) {
      ctrl.updateDisplay()
    }
  })
  gui.add(materiali, 'emerald').onFinishChange(function(value) {
    // Fires when a controller loses focus.
    if (value == true) {
      for (let i in materiali) materiali[i] = false
      materiali.emerald = true
      console.log('emerald')

      setMaterial(materialData.emerald)
    }

    // Iterate over all controllers
    for (let ctrl of gui.__controllers) {
      ctrl.updateDisplay()
    }
  })
  gui.add(materiali, 'bronze').onFinishChange(function(value) {
    // Fires when a controller loses focus.
    if (value == true) {
      for (let i in materiali) materiali[i] = false
      materiali.bronze = true
      console.log('bronze')

      setMaterial(materialData.bronze)
    }

    // Iterate over all controllers
    for (let ctrl of gui.__controllers) {
      ctrl.updateDisplay()
    }
  })
  gui.add(materiali, 'jade').onFinishChange(function(value) {
    // Fires when a controller loses focus.
    if (value == true) {
      for (let i in materiali) materiali[i] = false
      materiali.jade = true
      console.log('jade')

      setMaterial(materialData.jade)
    }

    // Iterate over all controllers
    for (let ctrl of gui.__controllers) {
      ctrl.updateDisplay()
    }
  })
  gui.add(materiali, 'gold').onFinishChange(function(value) {
    // Fires when a controller loses focus.
    if (value == true) {
      for (let i in materiali) materiali[i] = false
      materiali.gold = true
      console.log('gold')

      setMaterial(materialData.gold)
    }

    // Iterate over all controllers
    for (let ctrl of gui.__controllers) {
      ctrl.updateDisplay()
    }
  })

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

const initVertexBuffersCube = gl => {
  // create the shape
  const shape = new Sphere(100, 1)

  // Write the vertex property to buffers (coordinates and normals)
  // Same data can be used for vertex and normal
  // In order to make it intelligible, another buffer is prepared separately
  if (!initArrayBuffer(gl, 'a_Position', new Float32Array(shape.vertices), gl.FLOAT, 3)) return -1
  if (!initArrayBuffer(gl, 'a_Normal', new Float32Array(shape.normals), gl.FLOAT, 3)) return -1

  // Unbind the buffer object
  gl.bindBuffer(gl.ARRAY_BUFFER, null)

  // Write the indices to the buffer object
  const indexBuffer = gl.createBuffer()
  if (!indexBuffer) {
    console.log('Failed to create the buffer object')
    return -1
  }
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(shape.indices), gl.STATIC_DRAW)

  return shape.indices.length
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
