export const COLORS = ['WHITE', 'BLUE', 'RED', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'TEAL', 'PINK'];

export const ANIMATION_TYPES = [
  'None',
  'Create',
  'Uncreate',
  'FadeIn',
  'FadeOut',
  'Write',
  'DrawBorderThenFill',
  'GrowFromCenter',
];

const baseAnimationDefaults = {
  intro_animation: 'Create',
  intro_duration: 1.0,
  outro_animation: 'None',
  outro_duration: 1.0,
};

export const NODE_REGISTRY = {
  Circle: {
    type: 'Circle',
    label: 'Circle',
    category: 'Mobjects',
    group: 'Geometry',
    port: 'sequence',
    defaults: { ...baseAnimationDefaults, radius: 1.1, color: 'BLUE', fill_opacity: 0.7, stroke_width: 4 },
  },
  Square: {
    type: 'Square',
    label: 'Square',
    category: 'Mobjects',
    group: 'Geometry',
    port: 'sequence',
    defaults: { ...baseAnimationDefaults, side_length: 2, color: 'BLUE', fill_opacity: 0.7, stroke_width: 4 },
  },
  Polygon: {
    type: 'Polygon',
    label: 'Polygon',
    category: 'Mobjects',
    group: 'Geometry',
    port: 'sequence',
    defaults: { ...baseAnimationDefaults, vertices: '[(0, 0, 0), (2, 0, 0), (1, 1.5, 0)]', color: 'YELLOW', fill_opacity: 0.55, stroke_width: 4 },
  },
  Annulus: {
    type: 'Annulus',
    label: 'Annulus',
    category: 'Mobjects',
    group: 'Geometry',
    port: 'sequence',
    defaults: { ...baseAnimationDefaults, inner_radius: 0.7, outer_radius: 1.5, color: 'TEAL', fill_opacity: 0.45, stroke_width: 4 },
  },
  Text: {
    type: 'Text',
    label: 'Text',
    category: 'Mobjects',
    group: 'Text',
    port: 'sequence',
    defaults: { ...baseAnimationDefaults, intro_animation: 'Write', text_content: 'Manimatic', font_size: 36, color: 'WHITE' },
  },
  MathTex: {
    type: 'MathTex',
    label: 'MathTex',
    category: 'Mobjects',
    group: 'Text',
    port: 'sequence',
    defaults: { ...baseAnimationDefaults, intro_animation: 'Write', tex_string: 'E = mc^2', font_size: 42, color: 'WHITE' },
  },
  Axes: {
    type: 'Axes',
    label: 'Axes',
    category: 'Mobjects',
    group: 'Coordinate',
    port: 'sequence',
    defaults: { ...baseAnimationDefaults, x_range: '[-4, 4, 1]', y_range: '[-3, 3, 1]', x_length: 8, y_length: 5, axis_config: '{"include_tip": True}' },
  },
  NumberPlane: {
    type: 'NumberPlane',
    label: 'NumberPlane',
    category: 'Mobjects',
    group: 'Coordinate',
    port: 'sequence',
    defaults: { ...baseAnimationDefaults, x_range: '[-4, 4, 1]', y_range: '[-3, 3, 1]', x_length: 8, y_length: 5 },
  },
  CodeBlock: {
    type: 'CodeBlock',
    label: 'CodeBlock',
    category: 'Mobjects',
    group: 'Code',
    port: 'sequence',
    defaults: { ...baseAnimationDefaults, verbatim_code: '# self.play(...) body lines only' },
  },
  Wait: { 
    type: 'Wait', 
    label: 'Wait', 
    category: 'Logic', 
    group: 'Timing', 
    port: 'sequence', 
    defaults: { duration: 0.5 } 
  },
  VGroup: { 
    type: 'VGroup', 
    label: 'VGroup', 
    category: 'Logic', 
    group: 'State', 
    port: 'sequence', 
    defaults: { ...baseAnimationDefaults, member_ids: [], direction: 'DOWN', buff: 0.5 } 
  },
  SubScene: { 
    type: 'SubScene', 
    label: 'SubScene', 
    category: 'Logic', 
    group: 'Structure', 
    port: 'sequence', 
    defaults: { scene_class: 'NestedScene' } 
  },
};

export const registryByCategory = Object.values(NODE_REGISTRY).reduce((acc, item) => {
  acc[item.category] ||= [];
  acc[item.category].push(item);
  return acc;
}, {});

export const isMobject = (type) => NODE_REGISTRY[type]?.category === 'Mobjects' || type === 'VGroup';
export const isLogic = (type) => NODE_REGISTRY[type]?.category === 'Logic';
