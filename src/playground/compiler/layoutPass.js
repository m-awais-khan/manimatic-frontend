const SAFE_X = 6.5;
const SAFE_Y = 3.5;

export function applyLayoutPass(manifest) {
  const next = structuredClone(manifest);
  let needsScale = false;
  for (const mo of next.mobjects || []) {
    const pos = mo.position || {};
    if (Math.abs(Number(pos.x || 0)) > SAFE_X || Math.abs(Number(pos.y || 0)) > SAFE_Y) {
      needsScale = true;
    }
    if (['Text', 'MathTex'].includes(mo.type)) {
      const params = mo.params || {};
      const size = Number(params.font_size || 24);
      const content = String(params.text_content || params.tex_string || '');
      if (size > 36 || content.length > 40) {
        mo._layout = { ...(mo._layout || {}), scale_to_fit_width: 12 };
      }
    }
  }
  next._layout_hints = { ...(next._layout_hints || {}), post_group_scale: needsScale };
  return next;
}
