export default function enableCanvasExtension(canvas: HTMLCanvasElement): void {
  // Enable some extension explicitly to get rid of warning
  const gl: WebGLRenderingContext | null = canvas.getContext('webgl');
  if (gl) {
    gl.getExtension('WEBGL_color_buffer_float');
    gl.getExtension('EXT_color_buffer_half_float');
  }
}