# Mandala Visualization Design Specification

## Table of Contents

1. [Overview](#overview)
2. [Quick Reference](#quick-reference)
3. [Visual Structure](#visual-structure)
4. [Logo Design Specifications](#logo-design-specifications)
5. [Layer Specifications](#layer-specifications)
6. [Animation Specifications](#animation-specifications)
7. [Color Specifications](#color-specifications)
8. [Responsive Design Requirements](#responsive-design-requirements)
9. [Technical Implementation Notes](#technical-implementation-notes)
10. [Accessibility Considerations](#accessibility-considerations)
11. [Performance Targets](#performance-targets)
12. [Browser Compatibility](#browser-compatibility)
13. [Customization Parameters](#customization-parameters)
14. [Deliverables Checklist](#deliverables-checklist)

---

## Overview

This specification describes a full-screen animated mandala visualization for use as a hero section background on a Next.js web application. The visualization consists of 11 concentric circular layers of rotating logo elements surrounding a central logo. The design creates a mesmerizing, meditative effect through continuous rotation animations.

**Use Case**: This mandala serves as an animated background element for the hero section of a marketing/landing page. The visualization should be purely decorative and non-interactive, running continuously in the background while other hero content (headlines, CTAs, etc.) is displayed in the foreground.

---

## Quick Reference

**Essential Numbers**:

- **Layers**: 11 concentric rotating circles (indices 0-10)
- **Center Logo Size**: 200px
- **Container**: 600×600px canvas, centered in viewport
- **Logo Count Range**: 13 logos (innermost) to 33 logos (outermost)
- **Logo Size Range**: 66px (innermost) to 176px (outermost)
- **Rotation Speed Range**: 5 seconds (innermost) to 55 seconds (outermost)
- **Colors**: Alternating #af3029 (red) and #24837b (teal), OR rainbow mode (16 colors)

**Key Animations**:

- **Layer Rotation**: Continuous, alternating directions, linear easing
- **Logo Bobbing**: 4-second cycle, -4px vertical movement, ease-in-out
- **Center Logo**: Static, no animation

**Performance Target**: 60 FPS on modern devices

---

## Visual Structure

### Core Components

1. **Center Logo** - A single logo positioned at the exact center of the viewport, always visible
2. **11 Rotating Layers** - Concentric circles of logo elements that rotate continuously around the center
3. **Container** - Full viewport height container that centers all elements

**Important**: Unlike an interactive recording button implementation, this hero background version should display all 11 rotating layers continuously. There is no "inactive" state - the animation runs perpetually to create an engaging background effect.

### Layout Specifications

- **Container Dimensions**: Full viewport width × 100vh (full screen height) & mobile responsive
- **Canvas Size**: 600px × 600px (centered within viewport)
- **Center Logo Size**: 200px (default, scalable)
- **Layer Arrangement**: 11 concentric circles radiating outward from center

---

## Logo Design Specifications

### Logo Element: "KI" Logo

Each logo element is an SVG graphic representing the "KI" brand mark. The logo is highly geometric and symmetrical.

#### Visual Description:

Imagine looking at the logo head-on: you see a perfect square with a circle around it touching all four corners. Inside the square, there are two "K" letters mirroring each other. Each K consists of a vertical line at the left/right edge and two diagonal lines that meet at the center, forming a diamond shape in the middle. At the very center where all the diagonals converge is a small filled dot.

#### Visual Elements:

1. **Outer Circle** - A circle that touches all four corners of the inscribed square (circumscribed circle)
2. **Square Frame** - A perfect square outline forming the main structure
3. **Left "K" Letter** - Vertical stem on the left edge with two diagonal lines pointing toward center
4. **Right "K" Letter** - Vertical stem on the right edge with two diagonal lines pointing toward center
5. **Center Dot** - A filled circle at the exact center where diagonals meet

**Key Insight**: The two K letters create a symmetrical diamond pattern when viewed together, with the center dot as the focal point.

#### SVG Specifications:

- **ViewBox**: `0 0 100 100`
- **Coordinate System**: Centered at (50, 50)
- **Letter Spacing**: 20 units (default, adjustable)
- **Square Dimensions**: Width = 2 × letterSpacing, centered vertically at y=50
- **Circle Radius**: `(squareHeight × √2) / 2` (diagonal of square divided by 2)

#### SVG Path Definitions:

Given default `letterSpacing = 20`:

**Calculated Values:**

```
leftX = 50 - letterSpacing = 30
rightX = 50 + letterSpacing = 70
squareHeight = rightX - leftX = 40
centerY = 50
topY = centerY - squareHeight/2 = 30
bottomY = centerY + squareHeight/2 = 70
circleRadius = (squareHeight × √2) / 2 = (40 × 1.414) / 2 ≈ 28.28
```

**Outer Circle:**

- SVG: `<circle cx="50" cy="50" r="28.28" stroke="..." strokeWidth="..." fill="none" />`

**Square Frame:**

- SVG Path: `M 30 30 L 70 30 L 70 70 L 30 70 Z`
- Forms a perfect 40×40 square centered at (50, 50)

**Left K (Vertical Stem + Two Diagonals):**

- Vertical stem: `M 30 30 L 30 70` (left edge, top to bottom)
- Top diagonal: `M 30 50 L 50 30` (from stem center to square top-center)
- Bottom diagonal: `M 30 50 L 50 70` (from stem center to square bottom-center)
- Combined as: `M 30 30 L 30 70 M 30 50 L 50 30 M 30 50 L 50 70`

**Right K (Vertical Stem + Two Diagonals):**

- Vertical stem: `M 70 30 L 70 70` (right edge, top to bottom)
- Top diagonal: `M 70 50 L 50 30` (from stem center to square top-center)
- Bottom diagonal: `M 70 50 L 50 70` (from stem center to square bottom-center)
- Combined as: `M 70 30 L 70 70 M 70 50 L 50 30 M 70 50 L 50 70`

**Center Dot:**

- SVG: `<circle cx="50" cy="50" r="[dotSize]" fill="[color]" />`
- Default `dotSize = 2` for layer logos, `centerSize × 0.015` for center logo

#### Styling:

- **Stroke**: Solid line, color configurable
- **Stroke Width**: Configurable (default: 1.5px for layer logos, scales with center logo size)
- **Fill**: None (except center dot)
- **Line Caps**: Round
- **Line Joins**: Round

#### Animation:

- **Bobbing Effect**: Continuous vertical bobbing animation
  - Range: 0 to -4px
  - Duration: 2 seconds up, 2 seconds down (4 second total cycle)
  - Easing: Smooth timing function (ease-in-out)
  - Loop: Infinite

#### Complete SVG Example:

Here's a complete KI logo SVG with default parameters:

```svg
<svg width="60" height="60" viewBox="0 0 100 100">
  <!-- Outer circle touching square corners -->
  <circle
    cx="50"
    cy="50"
    r="28.28"
    stroke="#3B82F6"
    strokeWidth="2"
    fill="none"
  />

  <!-- Perfect square frame -->
  <path
    d="M 30 30 L 70 30 L 70 70 L 30 70 Z"
    stroke="#3B82F6"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
  />

  <!-- Left K: vertical stem -->
  <path
    d="M 30 30 L 30 70"
    stroke="#3B82F6"
    strokeWidth="2"
    strokeLinecap="round"
    fill="none"
  />

  <!-- Left K: diagonals forming diamond -->
  <path
    d="M 30 50 L 50 30 M 30 50 L 50 70"
    stroke="#3B82F6"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
  />

  <!-- Right K: vertical stem -->
  <path
    d="M 70 30 L 70 70"
    stroke="#3B82F6"
    strokeWidth="2"
    strokeLinecap="round"
    fill="none"
  />

  <!-- Right K: diagonals forming diamond -->
  <path
    d="M 70 50 L 50 30 M 70 50 L 50 70"
    stroke="#3B82F6"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    fill="none"
  />

  <!-- Center dot -->
  <circle
    cx="50"
    cy="50"
    r="3"
    fill="#3B82F6"
  />
</svg>
```

**Note**: The bobbing animation should be applied to a wrapper element around this SVG, not to the SVG itself.

---

## Layer Specifications

### Layer Configuration (11 Layers, Indexed 0-10)

Each layer has the following calculated properties:

#### Base Values:

- **Base Logo Size**: 55px
- **Logo Size Increment**: 11px per layer
- **Base Radius**: 20px
- **Radius Spacing**: 36px
- **Base Logo Count**: 11 logos
- **Logo Count Increment**: 2 logos per layer

#### Layer Calculations (for layer index `i`, where i = 0 to 10):

```
layerIndex = i + 1  // 1-based indexing

logoSize = (baseLogoSize + layerIndex × logoSizeIncrement) × logoSizeMultiplier
         = (55 + layerIndex × 11) × 1.0

radius = (baseRadius + layerIndex × (radiusSpacing + baseLogoSize × 0.01)) × radiusSpacingMultiplier
       = (20 + layerIndex × (36 + 55 × 0.01)) × 1.0
       = (20 + layerIndex × 36.55) × 1.0

logoCount = round((baseLogoCount + layerIndex × logoCountIncrement) × logoCountMultiplier)
          = round((11 + layerIndex × 2) × 1.0)

opacity = 0.5 + layerIndex × 0.05
```

#### Example Layer Values:

| Layer | Logo Size | Radius   | Logo Count | Opacity |
| ----- | --------- | -------- | ---------- | ------- |
| 0     | 66px      | 56.55px  | 13         | 0.55    |
| 1     | 77px      | 93.10px  | 15         | 0.60    |
| 2     | 88px      | 129.65px | 17         | 0.65    |
| 3     | 99px      | 166.20px | 19         | 0.70    |
| 4     | 110px     | 202.75px | 21         | 0.75    |
| 5     | 121px     | 239.30px | 23         | 0.80    |
| 6     | 132px     | 275.85px | 25         | 0.85    |
| 7     | 143px     | 312.40px | 27         | 0.90    |
| 8     | 154px     | 348.95px | 29         | 0.95    |
| 9     | 165px     | 385.50px | 31         | 1.00    |
| 10    | 176px     | 422.05px | 33         | 1.00    |

### Logo Positioning on Each Layer

For each logo on a layer:

```
angle = (logoIndex / logoCount) × 2π
x = cos(angle) × radius
y = sin(angle) × radius
rotation = (angle × 180 / π) + 90°  // Point outward from center
```

---

## Animation Specifications

### Rotation Animations

#### Layer Rotation:

- **Total Layers**: 11 (one animation per layer)
- **Direction**: Alternating (even indices clockwise, odd indices counter-clockwise)
- **Base Speed**: 5000ms per full rotation
- **Speed Increment**: +5000ms per layer
- **Speed Multiplier**: 1.0 (default, adjustable)

#### Speed Calculation:

```
layerSpeed = (baseRotationSpeed + layerIndex × rotationSpeedIncrement) / rotationSpeedMultiplier
           = (5000 + layerIndex × 5000) / 1.0
```

#### Example Speeds:

| Layer | Speed (ms) | Direction         |
| ----- | ---------- | ----------------- |
| 0     | 5000       | Clockwise         |
| 1     | 10000      | Counter-clockwise |
| 2     | 15000      | Clockwise         |
| 3     | 20000      | Counter-clockwise |
| 4     | 25000      | Clockwise         |
| 5     | 30000      | Counter-clockwise |
| 6     | 35000      | Clockwise         |
| 7     | 40000      | Counter-clockwise |
| 8     | 45000      | Clockwise         |
| 9     | 50000      | Counter-clockwise |
| 10    | 55000      | Clockwise         |

#### Animation Properties:

- **Type**: Continuous loop
- **Easing**: Linear (constant speed)
- **Interpolation**: 360° rotation (clockwise: 0° to 360°, counter-clockwise: 0° to -360°)

### Center Logo

- **Size**: Static at full size (200px default, or configured size)
- **Animation**: None - the center logo remains static
- **Visual Effect**: Should have a subtle shadow to lift it above the rotating layers
  - Shadow: `0px 8px 16px rgba(0, 0, 0, 0.3)`
- **Note**: Unlike interactive implementations that scale the center logo, this hero background version keeps the center logo at full size at all times

---

## Color Specifications

### Default Color Scheme

#### Layer Colors (Alternating):

- **Even Layers (0, 2, 4, 6, 8, 10)**: `#af3029` (Red/Accent)
- **Odd Layers (1, 3, 5, 7, 9)**: `#24837b` (Teal/Accent-2)

#### Center Logo Color:

- Configurable, defaults to primary brand color
- Suggested: `#3B82F6` (Blue) or match brand identity

### Rainbow Mode (Optional)

When rainbow mode is enabled, each layer uses a different color from the palette:

**Color Palette (16 colors):**

| Index | Color Name    | Hex Code |
| ----- | ------------- | -------- |
| 0     | Red           | #AF3029  |
| 1     | Orange        | #BC5215  |
| 2     | Yellow        | #AD8301  |
| 3     | Green         | #66800B  |
| 4     | Cyan          | #24837B  |
| 5     | Blue          | #205EA6  |
| 6     | Purple        | #5E409D  |
| 7     | Magenta       | #A02F6F  |
| 8     | Light Red     | #D14D41  |
| 9     | Light Orange  | #DA702C  |
| 10    | Light Yellow  | #D0A215  |
| 11    | Light Green   | #879A39  |
| 12    | Light Cyan    | #3AA99F  |
| 13    | Light Blue    | #4385BE  |
| 14    | Light Purple  | #8B7EC8  |
| 15    | Light Magenta | #CE5D97  |

Layer color = `COLOR_PALETTE[layerIndex % 16].hex`

---

## Responsive Design Requirements

### Viewport Adaptation

- **Container**: Must fill 100vh (full viewport height)
- **Canvas**: 600px × 600px, centered both horizontally and vertically
- **Scaling**: For smaller viewports (< 600px height), scale canvas proportionally while maintaining aspect ratio
- **Center Logo**: Scales proportionally with canvas if viewport is smaller

### Breakpoint Considerations

- **Desktop (> 1024px)**: Full 600px canvas
- **Tablet (768px - 1024px)**: Full 600px canvas (may need slight scaling)
- **Mobile (< 768px)**: Scale canvas to fit viewport while maintaining 1:1 aspect ratio
  - Minimum canvas size: 300px × 300px
  - Scale factor: `min(1, viewportHeight / 600)`

### Performance Optimization

- Use CSS transforms for rotations (GPU-accelerated)
- Consider reducing layer count or logo count on lower-end devices
- Implement `will-change: transform` for animated elements
- Use `transform: translateZ(0)` to force GPU acceleration

---

## Technical Implementation Notes

### Web Technologies

#### Recommended Stack:

- **HTML5**: Semantic structure
- **CSS3**: Animations and transforms
- **JavaScript/TypeScript**: Animation control and calculations
- **SVG**: Logo rendering

#### Animation Libraries (Optional):

- **GSAP**: For smooth, performant animations
- **Framer Motion**: If using React
- **CSS Animations**: Native CSS for simpler implementation
- **Web Animations API**: Modern browser support

### Implementation Approach

#### Option 1: Pure CSS + JavaScript

- Use CSS `@keyframes` for rotations
- JavaScript for dynamic calculations and positioning
- SVG for logo rendering

#### Option 2: Canvas API

- Single `<canvas>` element
- Manual drawing of all elements
- RequestAnimationFrame for animations
- Higher performance, more complex implementation

#### Option 3: SVG + CSS/JS

- SVG groups for each layer
- CSS transforms for rotations
- JavaScript for positioning calculations
- Best for scalability and accessibility

#### Recommended: Option 3 (SVG + CSS/JS)

- Maintains vector quality at all scales
- Better performance than canvas for this use case
- Easier to style and maintain
- Better accessibility support

### CSS Animation Examples

Here are example CSS animations for reference:

#### Bobbing Animation (for logo elements):

```css
@keyframes bob {
  0%,
  100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-4px);
  }
}

.logo-element {
  animation: bob 4s ease-in-out infinite;
}
```

#### Layer Rotation (clockwise):

```css
@keyframes rotate-clockwise {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.layer-0 {
  animation: rotate-clockwise 5s linear infinite;
}
```

#### Layer Rotation (counter-clockwise):

```css
@keyframes rotate-counter-clockwise {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(-360deg);
  }
}

.layer-1 {
  animation: rotate-counter-clockwise 10s linear infinite;
}
```

#### Reduced Motion Support:

```css
@media (prefers-reduced-motion: reduce) {
  .mandala-layer,
  .logo-element {
    animation: none;
  }
}
```

### Coordinate System

- **Origin**: Center of viewport (0, 0)
- **X-axis**: Left (negative) to Right (positive)
- **Y-axis**: Top (negative) to Bottom (positive)
- **Angles**: 0° = right (3 o'clock), increasing counter-clockwise

### Transform Order

When applying transforms to logo elements:

1. Translate to position (x, y)
2. Rotate to point outward (angle + 90°)
3. Apply layer rotation (continuous animation)

---

## Accessibility Considerations

### Visual Accessibility

**CRITICAL**: This visualization contains continuous motion animations. You MUST implement reduced motion support to ensure accessibility compliance and avoid triggering vestibular disorders.

#### Required Implementation:

```css
/* Respect user's motion preferences - REQUIRED */
@media (prefers-reduced-motion: reduce) {
  .mandala-layer {
    animation: none !important;
  }

  .logo-element {
    animation: none !important;
  }

  /* Optional: provide a subtle static or minimal motion alternative */
  .mandala-container {
    opacity: 0.6; /* Reduce prominence when motion is disabled */
  }
}
```

#### Additional Accessibility Considerations:

- **Color Contrast**: The mandala is decorative, but ensure sufficient contrast with background for visibility
- **Alternative Content**: Consider adding `aria-hidden="true"` to the mandala container since it's purely decorative
- **Loading State**: Show a static version or skeleton while mandala loads to avoid layout shift
- **Performance**: On low-end devices, consider reducing layer count or disabling animations automatically

### Semantic HTML

Since this is a non-interactive decorative element:

```html
<div class="mandala-container" role="presentation" aria-hidden="true">
  <!-- Mandala visualization -->
</div>
```

No keyboard navigation or interactive ARIA labels needed - this is purely visual decoration.

---

## Performance Targets

### Frame Rate

- Target: 60 FPS
- Minimum: 30 FPS on mid-range devices

### Load Time

- Initial render: < 500ms
- Full animation start: < 1s

### Resource Usage

- Memory: < 50MB
- CPU: < 20% on modern desktop browsers

---

## Browser Compatibility

### Minimum Requirements

- Chrome/Edge: Latest 2 versions
- Firefox: Latest 2 versions
- Safari: Latest 2 versions
- Mobile Safari: iOS 13+
- Chrome Mobile: Latest 2 versions

### Required Features

- CSS Transforms
- CSS Animations
- SVG Support
- ES6+ JavaScript

---

## Customization Parameters

### Adjustable Settings

All values should be configurable via CSS variables or JavaScript configuration:

```javascript
const mandalaConfig = {
  // Layer configuration
  layerCount: 11,
  baseLogoSize: 55,
  logoSizeIncrement: 11,
  baseRadius: 20,
  radiusSpacing: 36,
  baseLogoCount: 11,
  logoCountIncrement: 2,

  // Animation
  baseRotationSpeed: 5000,
  rotationSpeedIncrement: 5000,
  rotationSpeedMultiplier: 1.0,

  // Colors
  layerColors: ["#af3029", "#24837b"],
  centerLogoColor: "#3B82F6",
  rainbowMode: false,

  // Center logo
  centerSize: 200,
  centerStrokeWidth: 2,
  centerDotSize: 3,

  // Multipliers (for fine-tuning)
  logoSizeMultiplier: 1.0,
  logoCountMultiplier: 1.0,
  radiusSpacingMultiplier: 1.0,
};
```

---

## Visual Reference

### Layer Visualization

```
                    [Layer 10: 33 logos, 176px, 422px radius]

            [Layer 9: 31 logos, 165px, 386px radius]

        [Layer 8: 29 logos, 154px, 349px radius]

    [Layer 7: 27 logos, 143px, 312px radius]

[Layer 6: 25 logos, 132px, 276px radius]

[Layer 5: 23 logos, 121px, 239px radius]

[Layer 4: 21 logos, 110px, 203px radius]

[Layer 3: 19 logos, 99px, 166px radius]

[Layer 2: 17 logos, 88px, 130px radius]

[Layer 1: 15 logos, 77px, 93px radius]

[Layer 0: 13 logos, 66px, 57px radius]

        [Center Logo: 200px]
```

### Animation Flow

1. **Page Load**: All 11 layers and center logo visible immediately, animations start on mount
2. **Continuous Rotation**: All layers rotate indefinitely in alternating directions at their designated speeds
3. **No User Interaction**: Purely decorative background element, no click/touch handlers needed
4. **Layering**: The mandala should sit behind other hero section content (headlines, buttons, etc.)
   - Consider using CSS `z-index` or similar to ensure proper layering
   - May need semi-transparent overlay between mandala and foreground content for readability

---

## Deliverables Checklist

### Required Features

- [ ] SVG logo component (KI logo with all visual elements as specified)
- [ ] Responsive container that fills hero section
- [ ] 11 rotating layers with correct logo counts, sizes, and positioning
- [ ] Alternating rotation directions (even=clockwise, odd=counter-clockwise)
- [ ] Proper opacity fade from inner to outer layers (0.55 to 1.0)
- [ ] Static center logo (always visible at full size)
- [ ] Bobbing animation on all logo elements
- [ ] Default color scheme (red/teal alternating)
- [ ] Smooth 60 FPS animations
- [ ] Performance optimization (GPU acceleration via CSS transforms)

### Recommended Features

- [ ] Rainbow mode option (cycles through 16-color palette)
- [ ] Reduced motion support (`prefers-reduced-motion` media query)
- [ ] Mobile responsive scaling
- [ ] Configurable parameters (logo size, speed, colors, etc.)
- [ ] Cross-browser testing (Chrome, Firefox, Safari, Edge)

### Integration Considerations

- [ ] Proper z-index layering behind hero content
- [ ] Optional semi-transparent overlay for content readability
- [ ] Background color that complements the mandala
- [ ] Performance testing on mid-range devices

---

## Implementation Checklist

Before considering the implementation complete, verify:

1. **Visual Accuracy**: All 11 layers render with correct sizes, counts, and positioning
2. **Animation Smoothness**: Rotations are smooth and run at specified speeds
3. **Color Accuracy**: Colors match the hex codes specified in this document
4. **Logo Design**: KI logo SVG matches all specified elements (circle, square, K letters, center dot)
5. **Bobbing Effect**: All logo elements bob smoothly with 4-second cycle
6. **Responsiveness**: Mandala scales appropriately on different viewport sizes
7. **Performance**: Maintains 60 FPS on modern devices, gracefully degrades on older hardware
8. **Accessibility**: Respects `prefers-reduced-motion` setting

---

## Support & Questions

This specification is a complete standalone document. All necessary design information is included above. If you encounter ambiguities or need clarification on any aspect of the design, please document your questions and we can provide additional guidance.

**Key Design Principles to Remember**:

- Continuous animation (no start/stop states)
- Purely decorative (no interactivity)
- Background element (sits behind hero content)
- Meditative, mesmerizing effect through layered rotation

---

**Document Version**: 2.0
**Last Updated**: 2025-11-09
**Target Platform**: Next.js Web Application
**Use Case**: Hero Section Background Animation
