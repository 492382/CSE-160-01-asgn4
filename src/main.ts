import {Vector, invert_rotor, matrix_mul_vec, make_rotation_rotor, rotor_multiply, normalize_vec_or_bivec, rotor_to_matrix, matrix_multiply, make_scale_matrix, make_translation_matrix, matrix_list_multiply, Rotor} from "./math_stuff.js";

import {FractalBrownianMotion} from "./perlin_noise.js";

import {AndyScene} from "./webgl_stuff.js";

window.onload = main;

const WORLD_X_SIZE = 32;
const WORLD_Y_SIZE = 32;
const WORLD_Z_SIZE = 32;

let scene: AndyScene;

let global_rotor: Rotor = make_rotation_rotor(0.5, [1, 0, 0]);
let d_theta = 0.077;

let mouse_old_x: number | null = null;
let mouse_old_y: number | null = null;
let mouse_dx = 0.0;
let mouse_dy = 0.0;

let camera_pos: Vector = [0, 8 , 10];

type BlockType = "dirt" | "air";

let water_level = 2;
let world_blocks: BlockType[][][] =
  new Array(WORLD_Z_SIZE).fill(null).map(() => new Array(WORLD_Y_SIZE).fill(null).map(() => new Array(WORLD_X_SIZE).fill("air")));

let visualize_normals: boolean = false;

let auto_move_light: boolean = true;
let light_pos: Vector = [5, 3, 0];
let light_rgba: [number, number, number, number] = [1.0, 1.0, 0.0, 1.0];

let spotlight_pos: Vector = [0.0, 2.0, 0.0];
let spotlight_rgba: [number, number, number, number] = [0.5, 0.5, 1.0, 1.0];
let spotlight_rotor: Rotor = make_rotation_rotor(0.5, [1, 0, 0]);

async function main() {
  let canvas: HTMLCanvasElement = document.getElementById("andy_canvas") as HTMLCanvasElement;

  let vertex_src: string = await (await fetch('shaders/shader.vert')).text();
  let fragment_src: string = await (await fetch('shaders/shader.frag')).text();
  
  scene = new AndyScene(canvas, vertex_src, fragment_src);
  await scene.load_texture("textures/dirt.png", scene.gl.TEXTURE0);
  await scene.load_texture("textures/grass.jpg", scene.gl.TEXTURE1);
  await scene.load_texture("textures/sky.jpg", scene.gl.TEXTURE2);

  addUiCallbacks();


  let max_height = WORLD_Y_SIZE/2;

  for(let z = 0; z < WORLD_Z_SIZE; z++){
    for(let x = 0; x < WORLD_X_SIZE; x++){
      
      let height = Math.floor(FractalBrownianMotion((x/WORLD_X_SIZE) * 256.0, (z/WORLD_Z_SIZE) * 256.0, 3) * max_height);

      height = Math.min(height, max_height);//sometimes it goes too high idk why
      
      for(let i = 0; i < height; i++){
	world_blocks[z][i][x] = "dirt";
      }
    }
  }
  
  scene.set_do_lighting(true);
  let animation_loop = (timestamp_milis: number) => {
    if (mouse_dx * mouse_dx + mouse_dy * mouse_dy > 0) {
      //negate the dy because on the canvas positive Y is down instead of up
      global_rotor = rotor_multiply(
	make_rotation_rotor(
	  d_theta,
	  normalize_vec_or_bivec([mouse_dy, -mouse_dx, 0]),
	),
	global_rotor,
      );
    }
  
    let rot_mat = rotor_to_matrix(global_rotor);
    scene.set_matrix(
      scene.u_CameraMatrix,
      matrix_list_multiply([rot_mat, make_translation_matrix(-camera_pos[0], -camera_pos[1], -camera_pos[2])]),
    );

    if(auto_move_light){
      light_pos[0] = (WORLD_X_SIZE/2)*Math.cos(timestamp_milis / 1000.0);
      light_pos[2] = (WORLD_Z_SIZE/2)*Math.sin(timestamp_milis / 1000.0);
      set_sliders_values();
    }
    
    render(timestamp_milis);
    requestAnimationFrame(animation_loop);
  };
  requestAnimationFrame(animation_loop);
}

function addUiCallbacks() {
  let canvas: HTMLCanvasElement = document.getElementById("andy_canvas") as HTMLCanvasElement;

  canvas.addEventListener("mousedown", function (event) {
    
    let x = event.clientX;
    let y = event.clientY;

    let rect = (event.target as HTMLElement).getBoundingClientRect();
    x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    mouse_old_x = x;
    mouse_old_y = y;
    mouse_dx = 0;
    mouse_dy = 0;
  });

  
  canvas.addEventListener("mousemove", function (event) {
    if ((event.buttons & 1) != 1) {
      return;
    }
    let x = event.clientX;
    let y = event.clientY;

    let rect = (event.target as HTMLElement).getBoundingClientRect();
    x = (x - rect.left - canvas.width / 2) / (canvas.width / 2);
    y = (canvas.height / 2 - (y - rect.top)) / (canvas.height / 2);

    mouse_dx = x - mouse_old_x;
    mouse_dy = y - mouse_old_y;

    d_theta = Math.sqrt(mouse_dx * mouse_dx + mouse_dy * mouse_dy);

    mouse_old_x = x;
    mouse_old_y = y;
  });


  document.addEventListener("keydown", function (event){
    let rot_mat = rotor_to_matrix(invert_rotor(global_rotor));
    let camera_forward = matrix_mul_vec(rot_mat, [0, 0, -1]);
    let camera_right = matrix_mul_vec(rot_mat, [1, 0, 0]);
    if(event.code == "KeyW"){
      camera_pos[0] += camera_forward[0] * 0.5;
      camera_pos[1] += camera_forward[1] * 0.5;
      camera_pos[2] += camera_forward[2] * 0.5;
    }
    if(event.code == "KeyS"){
      camera_pos[0] -= camera_forward[0] * 0.5;
      camera_pos[1] -= camera_forward[1] * 0.5;
      camera_pos[2] -= camera_forward[2] * 0.5;
    }
    if(event.code == "KeyD"){
      camera_pos[0] += camera_right[0] * 0.5;
      camera_pos[1] += camera_right[1] * 0.5;
      camera_pos[2] += camera_right[2] * 0.5;
    }
    if(event.code == "KeyA"){
      camera_pos[0] -= camera_right[0] * 0.5;
      camera_pos[1] -= camera_right[1] * 0.5;
      camera_pos[2] -= camera_right[2] * 0.5;
    }
    if(event.code == "KeyE"){
      global_rotor = rotor_multiply(
	make_rotation_rotor(
	  0.1,
	  normalize_vec_or_bivec([0, 1, 0]),
	),
	global_rotor,
      );
    }
    if(event.code == "KeyQ"){
      global_rotor = rotor_multiply(
	make_rotation_rotor(
	  -0.1,
	  normalize_vec_or_bivec([0, 1, 0]),
	),
	global_rotor,
      );
    }
    if(event.code == "Space"){
      water_level = Math.min(WORLD_Y_SIZE-1, water_level + 1);
    }
    if(event.code == "KeyH"){
      water_level = Math.max(-1, water_level - 1);//-1 for no water
    }
  });

  
  
  document.getElementById("lighting_checkbox").addEventListener("input", function (event: Event) {
    scene.set_do_lighting((event.target as HTMLInputElement).checked);
  });

  document.getElementById("visualize_normals_checkbox").addEventListener("input", function (event: Event) {
    visualize_normals = (event.target as HTMLInputElement).checked;
  });

  let move_lighting_checkbox = document.getElementById("move_light_checkbox") as HTMLInputElement;
  
  move_lighting_checkbox.addEventListener("input", function (event: Event) {
    auto_move_light = (event.target as HTMLInputElement).checked;
  });

  document.getElementById("light_X_slider").addEventListener("input", function () {
    auto_move_light = false;
    move_lighting_checkbox.checked = false;
    set_light_pos_from_sliders();
  });
  document.getElementById("light_Y_slider").addEventListener("input", function () {
    set_light_pos_from_sliders();
  });
  document.getElementById("light_Z_slider").addEventListener("input", function () {
    auto_move_light = false;
    move_lighting_checkbox.checked = false;
    set_light_pos_from_sliders();
  });

  document.getElementById("light_R_slider").addEventListener("input", function () {
    set_light_color_from_sliders();
  });

  document.getElementById("light_G_slider").addEventListener("input", function () {
    set_light_color_from_sliders();
  });

  document.getElementById("light_B_slider").addEventListener("input", function () {
    set_light_color_from_sliders();
  });
  

}

function set_light_pos_from_sliders() {
  let x_pos = parseFloat((document.getElementById("light_X_slider") as HTMLInputElement).value);
  let y_pos = parseFloat((document.getElementById("light_Y_slider") as HTMLInputElement).value);
  let z_pos = parseFloat((document.getElementById("light_Z_slider") as HTMLInputElement).value);
  
  light_pos = [x_pos, y_pos, z_pos];
}

function set_light_color_from_sliders() {
  light_rgba[0] = parseFloat((document.getElementById("light_R_slider") as HTMLInputElement).value);
  light_rgba[1] = parseFloat((document.getElementById("light_G_slider") as HTMLInputElement).value);
  light_rgba[2] = parseFloat((document.getElementById("light_B_slider") as HTMLInputElement).value);
}

function set_sliders_values() {
  (document.getElementById("light_X_slider") as HTMLInputElement).value = light_pos[0].toString();
  (document.getElementById("light_Y_slider") as HTMLInputElement).value = light_pos[1].toString();
  (document.getElementById("light_Z_slider") as HTMLInputElement).value = light_pos[2].toString();
}


function render(milis: number) {
  scene.gl.clear(scene.gl.COLOR_BUFFER_BIT | scene.gl.DEPTH_BUFFER_BIT);


  spotlight_rotor = rotor_multiply(make_rotation_rotor(milis/1000.0, [0, 1, 0]), make_rotation_rotor(0.5, [1, 0, 0]));

  scene.set_camera_pos(camera_pos);
  scene.set_light_pos(light_pos);
  scene.set_light_color(light_rgba);
  
  scene.set_spotlight_pos(spotlight_pos);
  scene.set_spotlight_dir(spotlight_rotor);


  let norm_enum;

  if(visualize_normals){
    norm_enum = 7;
  }

  for(let z = 0; z < WORLD_Z_SIZE; z++){
    for(let y = 0; y < WORLD_Y_SIZE; y++){
      for(let x = 0; x < WORLD_X_SIZE; x++){
	switch(world_blocks[z][y][x]){
	  case "air":
	    if(y == water_level){
	      scene.gl.uniform4fv(scene.u_Color, new Float32Array([0.0, 0.5, 0.5, 1.0]));
	      scene.draw_cube(make_translation_matrix((x*2)-WORLD_X_SIZE, (y*2)-WORLD_Y_SIZE-0.4, (z*2)-WORLD_Z_SIZE), norm_enum || 5);
	    }
	    break;
	  case "dirt":
	    scene.draw_cube(make_translation_matrix((x*2)-WORLD_X_SIZE, (y*2)-WORLD_Y_SIZE, (z*2)-WORLD_Z_SIZE), norm_enum || 6);
	    break;
	  default:
	    console.error("unknown block");
	}
      }
    }
  }

  
  //water drops
  scene.draw_sphere(
    matrix_multiply(
      make_translation_matrix(WORLD_X_SIZE/2, (((milis%1000 / 1000) * -2) +1) * WORLD_Y_SIZE, WORLD_Z_SIZE/2),
      make_scale_matrix(2, 2, 2)
    ), norm_enum || 5);

  scene.draw_sphere(
    matrix_multiply(
      make_translation_matrix(-WORLD_X_SIZE/2, ((((milis + 250)%1000 / 1000) * -2) +1) * WORLD_Y_SIZE, WORLD_Z_SIZE/2),
      make_scale_matrix(2, 2, 2)
    ), norm_enum || 5);

  scene.draw_sphere(
    matrix_multiply(
      make_translation_matrix(-WORLD_X_SIZE/2, ((((milis + 500)%1000 / 1000) * -2) +1) * WORLD_Y_SIZE, -WORLD_Z_SIZE/2),
      make_scale_matrix(2, 2, 2)
    ), norm_enum || 5);

  scene.draw_sphere(
    matrix_multiply(
      make_translation_matrix(WORLD_X_SIZE/2, ((((milis + 750)%1000 / 1000) * -2) +1) * WORLD_Y_SIZE, -WORLD_Z_SIZE/2),
      make_scale_matrix(2, 2, 2)
    ), norm_enum || 5);


  
  //light
  scene.draw_sphere(
    matrix_multiply(
      make_translation_matrix(light_pos[0], light_pos[1], light_pos[2]),
      make_scale_matrix(2, 2, 2)
    ), 4);


  
  //spotlight
  scene.gl.uniform4fv(scene.u_Color, new Float32Array(spotlight_rgba));
  scene.draw_cube(
    matrix_list_multiply(
      [make_translation_matrix(spotlight_pos[0], spotlight_pos[1], spotlight_pos[2]),
	rotor_to_matrix(spotlight_rotor),
	make_scale_matrix(1, 1, 4),]
    ), 5);

  
  let ground_matrix = matrix_multiply(
    make_translation_matrix(0, -WORLD_Y_SIZE+0.2, 0),
    make_scale_matrix(WORLD_X_SIZE, 0.05, WORLD_Z_SIZE));
  scene.draw_cube(ground_matrix, norm_enum || 2);


  let sky_matrix = matrix_multiply(
    make_translation_matrix(0, -0.5, 0),
    make_scale_matrix(WORLD_X_SIZE, WORLD_Y_SIZE, WORLD_Z_SIZE));

  scene.draw_cube(sky_matrix, norm_enum || 3);
}
