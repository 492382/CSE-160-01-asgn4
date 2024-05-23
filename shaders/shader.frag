#version 300 es

precision mediump float;

uniform bool do_lighting;

uniform vec4 color;
uniform uint texture_enum;

uniform vec3 light_pos;
uniform vec4 light_color;
uniform vec3 camera_pos;


uniform sampler2D uSampler0;
uniform sampler2D uSampler1;
uniform sampler2D uSampler2;

in vec2 tex_coord;

in vec3 normal_vec;
in vec3 world_pos;
in vec3 model_pos;

out vec4 fragColor;

vec4 apply_lighting(vec4 base_color){
  vec3 light_incoming = normalize(world_pos - light_pos);
  vec3 light_reflection = light_incoming - 2.0*(dot(light_incoming, normal_vec))*normal_vec;
  vec3 camera_dir = normalize(camera_pos - world_pos);

  float shinyness = 3.0;
  
  float amount_ambient = 0.2;
  float amount_diffuse = clamp(dot(-1.0 * light_incoming, normal_vec), 0.0, 1.0);

  float specular_exp = clamp(dot(light_reflection, camera_dir), 0.0, 1.0);

  float amount_specular = pow(specular_exp, shinyness);


  vec4 diffuse_color  = mix(vec4(0.0, 0.0, 0.0, 1.0), base_color, amount_ambient + amount_diffuse);
  vec4 specular_color  = mix(diffuse_color, light_color,amount_specular);

  return specular_color;
}


void main() {
  if(texture_enum == 0u){
    fragColor = color;
  }else if(texture_enum == 1u){
    fragColor = texture(uSampler0, tex_coord);
  }else if(texture_enum == 2u){
    fragColor = texture(uSampler1, tex_coord);
  }else if(texture_enum == 3u){
    fragColor = texture(uSampler2, tex_coord);
  }else if(texture_enum == 4u){
    fragColor = light_color;
  }else if(texture_enum == 5u){
    if(do_lighting){
      fragColor = apply_lighting(color);
    }else{
      fragColor = color;
    }
  }else if(texture_enum == 6u){
    vec4 base_color = texture(uSampler0, tex_coord);
    if(do_lighting){
      fragColor = apply_lighting(base_color);
    }else{
      fragColor = base_color;
    }
  }else if(texture_enum == 7u){
    fragColor = vec4((vec3(1.0, 1.0, 1.0) + normal_vec)/2.0, 1.0);
  }else{
    fragColor = vec4(1.0, 0.0, 1.0, 1.0);
  }
}
