#version 300 es

uniform mat4 proj_matrix;
uniform mat4 camera_matrix;
uniform mat4 model_matrix;
uniform mat4 normal_matrix;

in vec3 attribute_model_position;
in vec2 attribute_tex_coord;
in vec3 attribute_normal_vec;

out vec3 model_pos;
out vec3 world_pos;
out vec2 tex_coord;
out vec3 normal_vec;

void main() {
  gl_Position = proj_matrix * camera_matrix * model_matrix * vec4(attribute_model_position, 1.0);
  world_pos = vec3(model_matrix * vec4(attribute_model_position, 1.0));
  model_pos = attribute_model_position;
  normal_vec = (normal_matrix * vec4(attribute_normal_vec, 1.0)).xyz;
  tex_coord = attribute_tex_coord;
}
