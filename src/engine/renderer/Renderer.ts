/* ════════════════════════════════════════════════════════════════════════
   PIXEL ENGINE — WebGL2 Sprite Batch Renderer
   High-performance batched sprite rendering using WebGL2.
   ════════════════════════════════════════════════════════════════════════ */

import { Camera } from '../core/Camera';

// ─── SHADERS ────────────────────────────────────────────────────────

const VERT_SRC = `#version 300 es
precision highp float;

// Per-vertex
in vec2 a_position;   // quad corner (0,0) to (1,1)
in vec2 a_texCoord;

// Per-instance
in vec2  a_offset;     // world position
in vec2  a_size;       // sprite width/height in world units
in float a_rotation;
in vec4  a_uvRect;     // u0, v0, u1, v1
in vec4  a_tint;
in float a_zIndex;

uniform mat3 u_viewMatrix;

out vec2 v_texCoord;
out vec4 v_tint;

void main() {
  // Map UV
  v_texCoord = mix(a_uvRect.xy, a_uvRect.zw, a_texCoord);
  v_tint = a_tint;

  // Scale quad by sprite size, center the pivot
  vec2 scaled = (a_position - 0.5) * a_size;

  // Rotate
  float c = cos(a_rotation);
  float s = sin(a_rotation);
  vec2 rotated = vec2(
    scaled.x * c - scaled.y * s,
    scaled.x * s + scaled.y * c
  );

  // Translate to world position
  vec2 worldPos = rotated + a_offset;

  // Apply camera view matrix (3x3 -> clip space)
  vec3 clipPos = u_viewMatrix * vec3(worldPos, 1.0);
  gl_Position = vec4(clipPos.xy, a_zIndex * 0.001, 1.0);
}
`;

const FRAG_SRC = `#version 300 es
precision highp float;

in vec2 v_texCoord;
in vec4 v_tint;

uniform sampler2D u_texture;
uniform bool u_useTexture;

out vec4 fragColor;

void main() {
  if (u_useTexture) {
    vec4 texColor = texture(u_texture, v_texCoord);
    fragColor = texColor * v_tint;
  } else {
    fragColor = v_tint;
  }

  // Discard fully transparent fragments
  if (fragColor.a < 0.01) discard;
}
`;

// ─── TYPES ──────────────────────────────────────────────────────────

export interface SpriteData {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  u0: number; v0: number;
  u1: number; v1: number;
  tint: [number, number, number, number];
  zIndex: number;
}

// ─── RENDERER ───────────────────────────────────────────────────────

const MAX_SPRITES = 10000;
// Per instance: offsetXY(2) + sizeXY(2) + rotation(1) + uvRect(4) + tint(4) + zIndex(1) = 14 floats
const INSTANCE_FLOATS = 14;

export class Renderer {
  private gl: WebGL2RenderingContext;
  private program: WebGLProgram;
  private vao: WebGLVertexArrayObject;
  private instanceBuffer: WebGLBuffer;
  private instanceData: Float32Array;
  private spriteCount = 0;

  // Uniform locations
  private uViewMatrix: WebGLUniformLocation;
  private uTexture: WebGLUniformLocation;
  private uUseTexture: WebGLUniformLocation;

  // Textures
  private textures = new Map<string, WebGLTexture>();
  private fallbackTexture: WebGLTexture;
  private currentTextureId: string | null = null;

  // Background color
  clearColor: [number, number, number, number] = [0.039, 0.055, 0.090, 1]; // #0a0e17

  constructor(private canvas: HTMLCanvasElement) {
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      premultipliedAlpha: false,
    });
    if (!gl) throw new Error('WebGL2 not supported');
    this.gl = gl;

    // Compile shaders & link program
    this.program = this.createProgram(VERT_SRC, FRAG_SRC);
    gl.useProgram(this.program);

    // Get uniform locations
    this.uViewMatrix = gl.getUniformLocation(this.program, 'u_viewMatrix')!;
    this.uTexture = gl.getUniformLocation(this.program, 'u_texture')!;
    this.uUseTexture = gl.getUniformLocation(this.program, 'u_useTexture')!;

    // Create VAO
    this.vao = gl.createVertexArray()!;
    gl.bindVertexArray(this.vao);

    // ─── Quad vertex buffer (shared across all instances) ───────────
    // Two triangles forming a unit quad
    const quadVerts = new Float32Array([
      // position  texCoord
      0, 0,   0, 0,
      1, 0,   1, 0,
      0, 1,   0, 1,
      1, 1,   1, 1,
    ]);
    const quadIndices = new Uint16Array([0, 1, 2, 2, 1, 3]);

    const quadVBO = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, quadVBO);
    gl.bufferData(gl.ARRAY_BUFFER, quadVerts, gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(this.program, 'a_position');
    const aTex = gl.getAttribLocation(this.program, 'a_texCoord');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 16, 0);
    gl.enableVertexAttribArray(aTex);
    gl.vertexAttribPointer(aTex, 2, gl.FLOAT, false, 16, 8);

    const ebo = gl.createBuffer()!;
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ebo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, quadIndices, gl.STATIC_DRAW);

    // ─── Instance buffer ────────────────────────────────────────────
    this.instanceData = new Float32Array(MAX_SPRITES * INSTANCE_FLOATS);
    this.instanceBuffer = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, this.instanceData.byteLength, gl.DYNAMIC_DRAW);

    // Set up instance attributes
    const stride = INSTANCE_FLOATS * 4; // bytes
    const attrs = [
      { name: 'a_offset',   size: 2, offset: 0 },
      { name: 'a_size',     size: 2, offset: 8 },
      { name: 'a_rotation', size: 1, offset: 16 },
      { name: 'a_uvRect',   size: 4, offset: 20 },
      { name: 'a_tint',     size: 4, offset: 36 },
      { name: 'a_zIndex',   size: 1, offset: 52 },
    ];

    for (const attr of attrs) {
      const loc = gl.getAttribLocation(this.program, attr.name);
      if (loc === -1) continue;
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, attr.size, gl.FLOAT, false, stride, attr.offset);
      gl.vertexAttribDivisor(loc, 1); // per-instance
    }

    gl.bindVertexArray(null);

    // ─── Blend & depth ──────────────────────────────────────────────
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    // ─── Fallback 1x1 white texture ─────────────────────────────────
    this.fallbackTexture = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.fallbackTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([255, 255, 255, 255]));
  }

  /** Resize the canvas and WebGL viewport */
  resize(width: number, height: number): void {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = width * dpr;
    this.canvas.height = height * dpr;
    this.canvas.style.width = width + 'px';
    this.canvas.style.height = height + 'px';
    this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
  }

  /** Load a texture from an Image element */
  loadTexture(id: string, image: HTMLImageElement): void {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.textures.set(id, tex);
  }

  /** Create a colored texture programmatically */
  createColorTexture(id: string, r: number, g: number, b: number, a = 255): void {
    const gl = this.gl;
    const tex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
      new Uint8Array([r, g, b, a]));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    this.textures.set(id, tex);
  }

  /** Begin a new frame */
  beginFrame(): void {
    const gl = this.gl;
    const [r, g, b, a] = this.clearColor;
    gl.clearColor(r, g, b, a);
    gl.clear(gl.COLOR_BUFFER_BIT);
    this.spriteCount = 0;
    this.currentTextureId = null;
  }

  /** Push a sprite into the batch */
  drawSprite(sprite: SpriteData): void {
    if (this.spriteCount >= MAX_SPRITES) {
      console.warn('Max sprite limit reached');
      return;
    }
    const i = this.spriteCount * INSTANCE_FLOATS;
    this.instanceData[i + 0]  = sprite.x;
    this.instanceData[i + 1]  = sprite.y;
    this.instanceData[i + 2]  = sprite.width;
    this.instanceData[i + 3]  = sprite.height;
    this.instanceData[i + 4]  = sprite.rotation;
    this.instanceData[i + 5]  = sprite.u0;
    this.instanceData[i + 6]  = sprite.v0;
    this.instanceData[i + 7]  = sprite.u1;
    this.instanceData[i + 8]  = sprite.v1;
    this.instanceData[i + 9]  = sprite.tint[0];
    this.instanceData[i + 10] = sprite.tint[1];
    this.instanceData[i + 11] = sprite.tint[2];
    this.instanceData[i + 12] = sprite.tint[3];
    this.instanceData[i + 13] = sprite.zIndex;
    this.spriteCount++;
  }

  /** Flush the batch to the GPU */
  endFrame(camera: Camera): void {
    if (this.spriteCount === 0) return;

    const gl = this.gl;
    gl.useProgram(this.program);
    gl.bindVertexArray(this.vao);

    // Upload view matrix
    gl.uniformMatrix3fv(this.uViewMatrix, false, camera.getViewMatrix());

    // Bind texture
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.fallbackTexture);
    gl.uniform1i(this.uTexture, 0);
    gl.uniform1i(this.uUseTexture, 0); // no texture by default

    // Upload instance data
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instanceBuffer);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0,
      this.instanceData.subarray(0, this.spriteCount * INSTANCE_FLOATS));

    // Draw instanced
    gl.drawElementsInstanced(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0, this.spriteCount);

    gl.bindVertexArray(null);
  }

  /** Draw a colored rectangle (convenience for editor grid, selection, etc.) */
  drawRect(x: number, y: number, w: number, h: number, color: [number, number, number, number]): void {
    this.drawSprite({
      x, y,
      width: w,
      height: h,
      rotation: 0,
      u0: 0, v0: 0, u1: 1, v1: 1,
      tint: color,
      zIndex: 0,
    });
  }

  // ─── Internals ────────────────────────────────────────────────────

  private createProgram(vertSrc: string, fragSrc: string): WebGLProgram {
    const gl = this.gl;
    const vs = this.compileShader(gl.VERTEX_SHADER, vertSrc);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, fragSrc);
    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error('Shader link error: ' + gl.getProgramInfoLog(prog));
    }
    return prog;
  }

  private compileShader(type: number, src: string): WebGLShader {
    const gl = this.gl;
    const shader = gl.createShader(type)!;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      const info = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error('Shader compile error: ' + info);
    }
    return shader;
  }

  /** Clean up WebGL resources */
  destroy(): void {
    const gl = this.gl;
    gl.deleteProgram(this.program);
    for (const tex of this.textures.values()) gl.deleteTexture(tex);
    gl.deleteTexture(this.fallbackTexture);
  }
}
