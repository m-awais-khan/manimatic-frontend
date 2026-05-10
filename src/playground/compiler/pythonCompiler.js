const DEFAULTS = {
  Circle: { radius: 1, color: 'BLUE', fill_opacity: 0.7, stroke_width: 4 },
  Square: { side_length: 2, color: 'BLUE', fill_opacity: 0.7, stroke_width: 4 },
  Polygon: { vertices: '[(0, 0, 0), (2, 0, 0), (1, 1.5, 0)]', color: 'BLUE', fill_opacity: 0.7, stroke_width: 4 },
  Annulus: { inner_radius: 1, outer_radius: 2, color: 'BLUE', fill_opacity: 0.5, stroke_width: 4 },
  Text: { text_content: 'Hello', font_size: 28, color: 'WHITE' },
  MathTex: { tex_string: 'E = mc^2', font_size: 36, color: 'WHITE' },
  Axes: { x_range: '[-4, 4, 1]', y_range: '[-3, 3, 1]', x_length: 8, y_length: 6, axis_config: '{"include_tip": True}' },
  NumberPlane: { x_range: '[-4, 4, 1]', y_range: '[-3, 3, 1]', x_length: 8, y_length: 6 },
};

const PREFIX = {
  Circle: 'circle',
  Square: 'square',
  Polygon: 'polygon',
  Annulus: 'annulus',
  Text: 'text',
  MathTex: 'mathtex',
  Axes: 'axes',
  NumberPlane: 'plane',
  VGroup: 'vgroup',
  CodeBlock: 'code_mob',
};

const q = (value) => JSON.stringify(String(value ?? ''));

class Context {
  constructor() {
    this.counts = {};
    this.vars = {};
    this.alias = {};
    this.body = [];
  }
  alloc(prefix) {
    this.counts[prefix] = (this.counts[prefix] || 0) + 1;
    return `${prefix}_${this.counts[prefix]}`;
  }
  resolve(id) {
    return this.alias[id] || this.vars[id];
  }
}

function placeLine(varName, mo) {
  const p = mo.position || {};
  return `${varName}.move_to([${Number(p.x || 0)}, ${Number(p.y || 0)}, ${Number(p.z || 0)}])`;
}

function emitMobject(ctx, mo) {
  const params = { ...(DEFAULTS[mo.type] || {}), ...(mo.params || {}) };
  const varName = ctx.alloc(PREFIX[mo.type] || mo.type.toLowerCase());
  ctx.vars[mo.id] = varName;

  if (mo.type === 'Circle') ctx.body.push(`${varName} = Circle(radius=${params.radius}, color=${params.color}, fill_opacity=${params.fill_opacity}, stroke_width=${params.stroke_width})`);
  if (mo.type === 'Square') ctx.body.push(`${varName} = Square(side_length=${params.side_length}, color=${params.color}, fill_opacity=${params.fill_opacity}, stroke_width=${params.stroke_width})`);
  if (mo.type === 'Polygon') ctx.body.push(`${varName} = Polygon(*${params.vertices}, color=${params.color}, fill_opacity=${params.fill_opacity}, stroke_width=${params.stroke_width})`);
  if (mo.type === 'Annulus') ctx.body.push(`${varName} = Annulus(inner_radius=${params.inner_radius}, outer_radius=${params.outer_radius}, color=${params.color}, fill_opacity=${params.fill_opacity}, stroke_width=${params.stroke_width})`);
  if (mo.type === 'Text') ctx.body.push(`${varName} = Text(${q(params.text_content)}, font_size=${params.font_size}, color=${params.color})`);
  if (mo.type === 'MathTex') ctx.body.push(`${varName} = MathTex(${q(params.tex_string)}, font_size=${params.font_size}, color=${params.color})`);
  if (mo.type === 'Axes') ctx.body.push(`${varName} = Axes(x_range=${params.x_range}, y_range=${params.y_range}, x_length=${params.x_length}, y_length=${params.y_length}, axis_config=${params.axis_config})`);
  if (mo.type === 'NumberPlane') ctx.body.push(`${varName} = NumberPlane(x_range=${params.x_range}, y_range=${params.y_range}, x_length=${params.x_length}, y_length=${params.y_length})`);
  if (mo.type === 'VGroup') {
    const members = (params.member_ids || []).map((id) => ctx.resolve(id)).filter(Boolean).join(', ');
    ctx.body.push(`${varName} = VGroup(${members}).arrange(${params.direction || 'DOWN'}, buff=${Number(params.buff || 0.5)})`);
  }
  if (mo.type === 'CodeBlock') {
    String(params.verbatim_code || '').split('\n').forEach((line) => {
      if (line.trim()) ctx.body.push(line);
    });
    return;
  }

  if (mo._layout?.scale_to_fit_width) ctx.body.push(`${varName}.scale_to_fit_width(${Number(mo._layout.scale_to_fit_width)})`);
  ctx.body.push(placeLine(varName, mo));
}

function animationExpr(ctx, step) {
  const targets = step.targets || [];
  const rt = Number(step.run_time || 1);
  if (['Transform', 'ReplacementTransform'].includes(step.type)) {
    const source = ctx.resolve(targets[0]);
    const target = ctx.resolve(targets[1]);
    ctx.alias[targets[1]] = source;
    if (step.type === 'Transform') return `Transform(${source}, ${target}, run_time=${rt})`;
    return `ReplacementTransform(${source}, ${target}, run_time=${rt})`;
  }
  const target = ctx.resolve(targets[0]);
  if (step.type === 'Rotate') return `Rotate(${target}, angle=${Number(step.angle || Math.PI)}, run_time=${rt})`;
  return `${step.type}(${target}, run_time=${rt})`;
}

function emitStep(ctx, step) {
  if (step.kind === 'wait') ctx.body.push(`self.wait(${Number(step.duration || 1)})`);
  if (step.kind === 'animation') ctx.body.push(`self.play(${animationExpr(ctx, step)})`);
  if (step.kind === 'parallel') {
    const exprs = (step.children || []).filter((child) => child.kind === 'animation').map((child) => animationExpr(ctx, child));
    if (exprs.length) ctx.body.push(`self.play(${exprs.join(', ')})`);
  }
}

export function compileManifestToPython(manifest) {
  const ctx = new Context();
  (manifest.mobjects || []).forEach((mo) => emitMobject(ctx, mo));
  (manifest.timeline || []).forEach((step) => emitStep(ctx, step));
  if (manifest._layout_hints?.post_group_scale) ctx.body.push('VGroup(*self.mobjects).scale_to_fit_width(12).move_to(ORIGIN)');

  const lines = [
    '# AUTO-GENERATED by Manimatic Visual Playground (deterministic compiler)',
    'from manim import *',
    '',
    `class ${manifest.scene_class || 'GeneratedScene'}(Scene):`,
    '    def construct(self):',
    ...(ctx.body.length ? ctx.body.map((line) => `        ${line}`) : ['        pass']),
  ];
  return `${lines.join('\n')}\n`;
}
