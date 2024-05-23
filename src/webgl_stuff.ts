import {Matrix, Rotor, Vector, make_rotation_rotor, make_scale_matrix, make_translation_matrix, matrix_mul_vec, matrix_multiply, normalize_vec_or_bivec, rotor_to_matrix} from "./math_stuff.js";

export class AndyScene {
  gl: WebGL2RenderingContext;
  program: WebGLProgram;
  u_CameraMatrix: WebGLUniformLocation;
  u_ModelMatrix: WebGLUniformLocation;
  u_NormalMatrix: WebGLUniformLocation;
  u_Color: WebGLUniformLocation;
  u_TextureEnum: WebGLUniformLocation;
  u_ProjMatrix: WebGLUniformLocation;
  u_CameraPos: WebGLUniformLocation;
  u_LightPos: WebGLUniformLocation;
  u_LightColor: WebGLUniformLocation;
  u_DoLight: WebGLUniformLocation;

  u_SpotlightPos: WebGLUniformLocation;
  u_SpotlightDirection: WebGLUniformLocation;
  
  a_Position: GLint;
  a_TexCoord: GLint;
  a_NormVec: GLint;
  cube_buffer: WebGLBuffer;
  cube_tex_buffer: WebGLBuffer;
  cube_norm_buffer: WebGLBuffer;

  sphere_buffer: WebGLBuffer;
    
  u_Sampler0: WebGLUniformLocation;
  u_Sampler1: WebGLUniformLocation;
  u_Sampler2: WebGLUniformLocation;

  constructor(canvas: HTMLCanvasElement, vertex_shader_src: string, frag_shader_src: string) {
    [this.gl, this.program, this.cube_buffer, this.cube_tex_buffer, this.cube_norm_buffer, this.sphere_buffer] = setupWebGL(canvas, vertex_shader_src, frag_shader_src);
    
    this.u_CameraMatrix = this.gl.getUniformLocation(this.program, "camera_matrix");
    this.u_ModelMatrix = this.gl.getUniformLocation(this.program, "model_matrix");
    this.u_NormalMatrix = this.gl.getUniformLocation(this.program, "normal_matrix");
    this.u_Color = this.gl.getUniformLocation(this.program, "color");
    this.u_TextureEnum = this.gl.getUniformLocation(this.program, "texture_enum");
    this.u_ProjMatrix = this.gl.getUniformLocation(this.program, "proj_matrix");
    this.u_CameraPos = this.gl.getUniformLocation(this.program, "camera_pos");
    this.u_LightPos = this.gl.getUniformLocation(this.program, "light_pos");
    this.u_LightColor = this.gl.getUniformLocation(this.program, "light_color");
    this.u_DoLight = this.gl.getUniformLocation(this.program, "do_lighting");
    
    this.u_SpotlightPos = this.gl.getUniformLocation(this.program, "spotlight_pos");
    this.u_SpotlightDirection = this.gl.getUniformLocation(this.program, "spotlight_dir");
    
    this.a_Position = this.gl.getAttribLocation(this.program, "attribute_model_position");
    this.a_TexCoord = this.gl.getAttribLocation(this.program, "attribute_tex_coord");
    this.a_NormVec = this.gl.getAttribLocation(this.program, "attribute_normal_vec");
  
    this.u_Sampler0 = this.gl.getUniformLocation(this.program, "uSampler0");
    this.u_Sampler1 = this.gl.getUniformLocation(this.program, "uSampler1");
    this.u_Sampler2 = this.gl.getUniformLocation(this.program, "uSampler2");

    this.gl.uniform1i(this.u_Sampler0, 0);
    this.gl.uniform1i(this.u_Sampler1, 1);
    this.gl.uniform1i(this.u_Sampler2, 2);
    this.gl.uniform1i(this.u_DoLight, 1);
    
    let r = 2;
    let l = -2;
    let t = 1;
    let b = -1;

    let f = -1;
    let n = 1;
    
    this.set_matrix(this.u_ProjMatrix, 
      [[(2*n)/(r-l), 0          , (r+l)/(r-l), 0],
	[0,           (2*n)/(t-b), (t+b)/(t-b), 0],
	[0,           0          , (n+f)/(n-f), (2*n*f)/(n-f)],
	[0          , 0          , -1          , 0]]
      
    );
  }

  set_do_lighting(do_it: boolean){
    if(do_it){
      this.gl.uniform1i(this.u_DoLight, 1);
    }else{
      this.gl.uniform1i(this.u_DoLight, 0);
    }
  }
  
  set_light_pos(pos: Vector){
    this.gl.uniform3fv(this.u_LightPos, new Float32Array(pos));
  }

  set_light_color(rgba: [number, number, number, number]){
    this.gl.uniform4fv(this.u_LightColor, new Float32Array(rgba));
  }

  set_spotlight_pos(pos: Vector){
    this.gl.uniform3fv(this.u_SpotlightPos, new Float32Array(pos));
  }

  set_spotlight_dir(orientation: Rotor){
    let out: Vector = matrix_mul_vec(
      rotor_to_matrix(orientation),
      [0, 0, 1]
    );
    this.gl.uniform3fv(this.u_SpotlightDirection, new Float32Array(out));
  }

    
  set_camera_pos(pos: Vector){
    this.gl.uniform3fv(this.u_CameraPos, new Float32Array(pos));
  }
  
  set_matrix(unif: WebGLUniformLocation, matrix: Matrix) {
    let flattened_matrix = Array(16)
      .fill(undefined)
      .map((_, index) => {
	return matrix[index % 4][Math.trunc(index / 4)];
      });

    this.gl.uniformMatrix4fv(unif, false, flattened_matrix);
  }
  
  
  draw_cube(model_matrix: Matrix, texture_enum: GLint) {
    this.gl.uniform1ui(this.u_TextureEnum, texture_enum);
    
    this.set_matrix(
      this.u_ModelMatrix,
      model_matrix
    );

    this.set_matrix(
      this.u_NormalMatrix,
      make_translation_matrix(0, 0, 0)
    );
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cube_buffer);
    this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cube_tex_buffer);
    this.gl.vertexAttribPointer(this.a_TexCoord, 2, this.gl.FLOAT, false, 0, 0);

    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.cube_norm_buffer);
    this.gl.vertexAttribPointer(this.a_NormVec, 3, this.gl.FLOAT, false, 0, 0);
    
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, NUM_CUBE_VERTS);
  }

  draw_sphere(model_matrix: Matrix, texture_enum: GLint) {
    this.gl.uniform1ui(this.u_TextureEnum, texture_enum);
    
    this.set_matrix(
      this.u_ModelMatrix,
      model_matrix
    );

    this.set_matrix(
      this.u_NormalMatrix,
      make_translation_matrix(0, 0, 0)
    );
    
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.sphere_buffer);
    this.gl.vertexAttribPointer(this.a_Position, 3, this.gl.FLOAT, false, 0, 0);

    this.gl.vertexAttribPointer(this.a_TexCoord, 2, this.gl.FLOAT, false, 0, 0);//fill with junk idk

    this.gl.vertexAttribPointer(this.a_NormVec, 3, this.gl.FLOAT, false, 0, 0);//unit sphere is its own normal
    
    this.gl.drawArrays(this.gl.TRIANGLES, 0, NUM_SPHERE_VERTS);
  }

  
  async load_texture(url: string, texture_enum: number) {
    let gl = this.gl;
    const texture = gl.createTexture();

    gl.activeTexture(texture_enum);
    gl.bindTexture(gl.TEXTURE_2D, texture);

    const level = 0;
    const internalFormat = gl.RGBA;
    const width = 1;
    const height = 1;
    const border = 0;
    const srcFormat = gl.RGBA;
    const srcType = gl.UNSIGNED_BYTE;
    const pixel = new Uint8Array([0, 0, 255, 255]); // opaque blue
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      width,
      height,
      border,
      srcFormat,
      srcType,
      pixel,
    );

    let image: HTMLImageElement = await new Promise(resolve => {
      const image = new Image();
      image.addEventListener("load", () => {
        resolve(image);
      });
      image.src = url;
    });

    gl.activeTexture(texture_enum);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      level,
      internalFormat,
      srcFormat,
      srcType,
      image,
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);

    gl.texParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  }
}

function setupWebGL(canvas: HTMLCanvasElement, vertex_shader_src: string, frag_shader_src: string): [WebGL2RenderingContext, WebGLProgram, WebGLBuffer, WebGLBuffer, WebGLBuffer, WebGLBuffer] {
  let gl = canvas.getContext("webgl2");

  //https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/By_example/Hello_GLSL
  const vertexShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertexShader, vertex_shader_src);
  gl.compileShader(vertexShader);

  const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragmentShader, frag_shader_src);
  gl.compileShader(fragmentShader);

  let program = gl.createProgram();

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);

  gl.linkProgram(program);

  gl.detachShader(program, vertexShader);
  gl.detachShader(program, fragmentShader);

  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const linkErrLog = gl.getProgramInfoLog(program);
    console.error(
      "Shader program did not link successfully. Error log: ",
      linkErrLog,
    );
    throw new Error("Shader didn't link");
  }

  let a_Position = gl.getAttribLocation(program, "attribute_model_position");
  gl.enableVertexAttribArray(a_Position);
  let a_TexCoord = gl.getAttribLocation(program, "attribute_tex_coord");
  gl.enableVertexAttribArray(a_TexCoord);
  let a_NormVec = gl.getAttribLocation(program, "attribute_normal_vec");
  gl.enableVertexAttribArray(a_NormVec);

  let cube_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cube_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, CUBE_VERTS, gl.STATIC_DRAW);

  let cube_tex_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cube_tex_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, CUBE_TEX_VERTS, gl.STATIC_DRAW);

  let cube_norm_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cube_norm_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, CUBE_NORM_VERTS, gl.STATIC_DRAW);

  let sphere_buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sphere_buffer);
  gl.bufferData(gl.ARRAY_BUFFER, SPHERE_VERTS, gl.STATIC_DRAW);

  gl.useProgram(program);

  gl.clearColor(0.2, 0.3, 0.5, 1);
  gl.enable(gl.DEPTH_TEST);
  // gl.enable(gl.BLEND);
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    
  return [gl, program, cube_buffer, cube_tex_buffer, cube_norm_buffer, sphere_buffer];
}

function make_cube_verts(): [Float32Array, Float32Array, Float32Array]{
  let center_matrix = matrix_multiply(
    make_translation_matrix(-1, -1, 0),
    make_scale_matrix(2, 2, 1));
  
  let unit_plane_verts: Vector[] = [
    [0.0, 0.0, 1.0],
    [1.0, 1.0, 1.0],
    [1.0, 0.0, 1.0],
    [0.0, 0.0, 1.0],
    [0.0, 1.0, 1.0],
    [1.0, 1.0, 1.0],
  ];

  let plane_normal: Vector = [0, 0, 1];
  
  let plane_verts = unit_plane_verts.map((vec: Vector) => matrix_mul_vec(center_matrix, vec));
  
  let rotors: Rotor[] = [
    make_rotation_rotor((TAU * 0), [1, 0, 0]),//front
    make_rotation_rotor((TAU * (1 / 4)), [1, 0, 0]),//bottom
    make_rotation_rotor((TAU * (1 / 2)), [1, 0, 0]),//back
    make_rotation_rotor((TAU * (3 / 4)), [1, 0, 0]),//top
    make_rotation_rotor((TAU * (1 / 4)), [0, 1, 0]),//right
    make_rotation_rotor((TAU * (-1 / 4)), [0, 1, 0]),//left
  ];
  
  let cube_verts: Vector[][] = rotors.map((rotor) => {
    return plane_verts.map((vec: Vector) => {
      return matrix_mul_vec(rotor_to_matrix(rotor), vec);
    });
  });
    
  let cube_tex_verts =
    new Array(rotors.length)
      .fill(unit_plane_verts.map((vec) => vec.slice(0, 2)))
      .flat();

  let cube_normal_verts: Vector[][] =
    rotors
      .map((rotor) => matrix_mul_vec(rotor_to_matrix(rotor), plane_normal))
      .map((normal_vec: Vector) => Array(plane_verts.length).fill(normal_vec));
  
  let cube_floats = new Float32Array(cube_verts.flat().flat());
  let cube_tex_floats = new Float32Array(cube_tex_verts.flat());
  let cube_normal_floats = new Float32Array(cube_normal_verts.flat().flat());
  
  return [cube_floats, cube_tex_floats, cube_normal_floats];
}

function make_sphere_verts(): Float32Array {
  //https://vorg.github.io/pex/docs/pex-gen/Icosahedron.html
  let phi = (1 + Math.sqrt(5)) / 2;
  let a = 1 / 2;
  let b = 1 / (2 * phi);

  let vertices: Vector[] = [
    [ 0, b, -a],
    [ b, a, 0],
    [-b, a, 0],
    [ 0, b, a],
    [ 0, -b, a],
    [-a, 0, b],
    [ a, 0, b],
    [ 0, -b, -a],
    [ a, 0, -b],
    [ -a, 0, -b],
    [ b, -a, 0],
    [-b, -a, 0]
  ];

  vertices = vertices.map((v) => normalize_vec_or_bivec(v));
  
  let faces_indicies = [
    [  1,  0,  2 ],
    [  2,  3,  1 ],
    [  4,  3,  5 ],
    [  6,  3,  4 ],
    [  7,  0,  8 ],
    [  9,  0,  7 ],
    [ 10,  4, 11 ],
    [ 11,  7, 10 ],
    [  5,  2,  9 ],
    [  9, 11,  5 ],
    [  8,  1,  6 ],
    [  6, 10,  8 ],
    [  5,  3,  2 ],
    [  1,  3,  6 ],
    [  2,  0,  9 ],
    [  8,  0,  1 ],
    [  9,  7, 11 ],
    [ 10,  7,  8 ],
    [ 11,  4,  5 ],
    [  6,  4, 10 ]
  ];


  let faces1: Vector[][] = faces_indicies.map((indicies) => indicies.map((i) => vertices[i]));
  let faces2: Vector[][] = iterate_icosahedron(faces1);
  let faces3: Vector[][] = iterate_icosahedron(faces2);
  return new Float32Array(faces3.flat().flat());
}

function iterate_icosahedron(faces: Vector[][]): Vector[][]{
  return faces.map((face: Vector[]) => {
    let avg_vecs = (vec1: Vector, vec2: Vector): Vector => {
      return (new Array(3)).fill(undefined).map((_, i) => (vec1[i] + vec2[i])/2) as Vector;
    };

    let new_faces: Vector[][] = face.map((vec, i) => {
      let others = [0, 1, 2];
      others.splice(i, 1);

      let middle_0 = avg_vecs(vec, face[others[0]]);
      let middle_1 = avg_vecs(vec, face[others[1]]);

      return [vec, middle_0, middle_1];
    });

    let middle_0 = avg_vecs(face[0], face[1]);
    let middle_1 = avg_vecs(face[0], face[2]);
    let middle_2 = avg_vecs(face[1], face[2]);
    
    new_faces.push([middle_0, middle_1, middle_2]);

    return new_faces.map((x) => x.map(normalize_vec_or_bivec));
  }).flat();
}

const TAU = Math.PI * 2;

const [CUBE_VERTS, CUBE_TEX_VERTS, CUBE_NORM_VERTS] = make_cube_verts();

const NUM_CUBE_VERTS = CUBE_VERTS.length / 3;

const SPHERE_VERTS = make_sphere_verts();

const NUM_SPHERE_VERTS = SPHERE_VERTS.length / 3;
