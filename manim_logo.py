from manim import *

class ManimaticLogo(Scene):
    def construct(self):
        self.camera.background_color = "#000000"
        
        # M vertices
        v1 = np.array([-2.5, -2, 0])
        v2 = np.array([-1.25, 2, 0])
        v3 = np.array([0, -0.8, 0])
        v4 = np.array([1.25, 2, 0])
        v5 = np.array([2.5, -2, 0])
        
        # Calculate crossbar for the 'A'
        y_bar = -0.5
        
        x1 = (y_bar - 6) / 3.2
        x2 = (y_bar + 0.8) / -2.24  # slope is dy/dx = 2.8 / 1.25 = 2.24. y = -2.24x - 0.8 -> x = (y+0.8)/-2.24
        
        p_bar_left = np.array([x1, y_bar, 0])
        p_bar_right = np.array([x2, y_bar, 0])

        thickness = 60
        
        # Continuous M path
        m_path = VMobject(color=WHITE)
        m_path.set_points_as_corners([v1, v2, v3, v4, v5])
        m_path.set_stroke(width=thickness)
        
        # Crossbar for A
        bar = Line(p_bar_left, p_bar_right, color=WHITE, stroke_width=thickness)

        # Group them
        ma_logo = VGroup(m_path, bar)
        
        # Add a subtle circle to frame it professionally
        # frame = Circle(radius=4, color=WHITE, stroke_width=20)
        # ma_logo = VGroup(m_path, bar, frame)

        ma_logo.move_to(ORIGIN)

        self.add(ma_logo)
