#version 300 es

precision mediump float;

uniform bool do_lighting;

uniform vec4 color;
uniform uint texture_enum;

uniform vec3 light_pos;
uniform vec4 light_color;
uniform vec3 camera_pos;

uniform vec3 spotlight_pos;
uniform vec3 spotlight_dir;


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


bool check_if_in_spotlight(){
  vec3 incoming = normalize(world_pos - spotlight_pos);
  vec3 lineup = normalize(spotlight_dir);
  
  float cos_angle = dot(incoming, lineup);

  if(cos_angle > 0.9){
    return true;
  }else{
    return false;
  }  
}

vec4 color_no_spotlight(){
  if(texture_enum == 0u){//color
    return color;
  }else if(texture_enum == 1u){// dirt
    return texture(uSampler0, tex_coord);
  }else if(texture_enum == 2u){// ground
    return texture(uSampler1, tex_coord);
  }else if(texture_enum == 3u){// sky
    return texture(uSampler2, tex_coord);
  }else if(texture_enum == 4u){//light
    return light_color;
  }else if(texture_enum == 5u){//color with light
    if(do_lighting){
      return apply_lighting(color);
    }else{
      return color;
    }
  }else if(texture_enum == 6u){//texture with light
    vec4 base_color = texture(uSampler0, tex_coord);
    if(do_lighting){
      return apply_lighting(base_color);
    }else{
      return base_color;
    }
  }else if(texture_enum == 7u){//normals
    return vec4((vec3(1.0, 1.0, 1.0) + normal_vec)/2.0, 1.0);
  }else if(texture_enum == 8u){//spotlight
    if(do_lighting){
      return apply_lighting(color);
    }else{
      return color;
    }
  }else{//error
    return vec4(1.0, 0.0, 1.0, 1.0);
  }
}

void main() {
  vec4 no_spotlight_color = color_no_spotlight();
  if(check_if_in_spotlight()){
    fragColor = mix(vec4(0.5, 0.5, 1.0, 1.0), no_spotlight_color, 0.5);
    return;
  }
  fragColor = no_spotlight_color;
  
}
