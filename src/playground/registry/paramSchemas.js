import { COLORS, ANIMATION_TYPES } from './manimRegistry';

const number = (key, label, min, max, step = 0.1) => ({ key, label, type: 'number', min, max, step });
const text = (key, label, multiline = false) => ({ key, label, type: multiline ? 'textarea' : 'text' });
const color = (key = 'params.color') => ({ key, label: 'Color', type: 'color', options: COLORS });
const select = (key, label, options) => ({ key, label, type: 'select', options });

export const COMMON_ANIMATION = [
  select('params.intro_animation', 'Intro Anim', ANIMATION_TYPES),
  number('params.intro_duration', 'Intro Time', 0.1, 10, 0.1),
  select('params.outro_animation', 'Outro Anim', ANIMATION_TYPES),
  number('params.outro_duration', 'Outro Time', 0.1, 10, 0.1),
];

export const COMMON_POSITION = [
  number('position.x', 'X', -7, 7, 0.1),
  number('position.y', 'Y', -4, 4, 0.1),
  number('position.z', 'Z', -3, 3, 0.1),
  ...COMMON_ANIMATION,
];

export const PARAM_SCHEMAS = {
  Circle: [number('params.radius', 'Radius', 0.1, 4), color(), number('params.fill_opacity', 'Fill', 0, 1, 0.05), number('params.stroke_width', 'Stroke', 0, 12, 1), ...COMMON_POSITION],
  Square: [number('params.side_length', 'Side', 0.2, 6), color(), number('params.fill_opacity', 'Fill', 0, 1, 0.05), number('params.stroke_width', 'Stroke', 0, 12, 1), ...COMMON_POSITION],
  Polygon: [text('params.vertices', 'Vertices'), color(), number('params.fill_opacity', 'Fill', 0, 1, 0.05), number('params.stroke_width', 'Stroke', 0, 12, 1), ...COMMON_POSITION],
  Annulus: [number('params.inner_radius', 'Inner', 0.1, 4), number('params.outer_radius', 'Outer', 0.2, 5), color(), number('params.fill_opacity', 'Fill', 0, 1, 0.05), number('params.stroke_width', 'Stroke', 0, 12, 1), ...COMMON_POSITION],
  Text: [text('params.text_content', 'Text'), number('params.font_size', 'Font', 8, 72, 1), color(), ...COMMON_POSITION],
  MathTex: [text('params.tex_string', 'TeX'), number('params.font_size', 'Font', 8, 72, 1), color(), ...COMMON_POSITION],
  Axes: [text('params.x_range', 'X Range'), text('params.y_range', 'Y Range'), number('params.x_length', 'X Length', 2, 12, 0.5), number('params.y_length', 'Y Length', 2, 8, 0.5), ...COMMON_POSITION],
  NumberPlane: [text('params.x_range', 'X Range'), text('params.y_range', 'Y Range'), number('params.x_length', 'X Length', 2, 12, 0.5), number('params.y_length', 'Y Length', 2, 8, 0.5), ...COMMON_POSITION],
  CodeBlock: [text('params.verbatim_code', 'Python', true), ...COMMON_ANIMATION],
  Wait: [number('params.duration', 'Seconds', 0, 10, 0.1)],
  VGroup: [text('params.member_ids', 'Members'), { key: 'params.direction', label: 'Direction', type: 'select', options: ['UP', 'DOWN', 'LEFT', 'RIGHT'] }, number('params.buff', 'Buffer', 0, 3, 0.1), ...COMMON_POSITION],
  SubScene: [text('params.scene_class', 'Scene Class')],
};
