# Glassmorphism Design System Specifications

## Table of Contents

1. [Overview](#overview)
2. [Core Properties](#core-properties)
3. [Platform-Specific Considerations](#platform-specific-considerations)
4. [Component Library](#component-library)
5. [Theme System](#theme-system)
6. [Animation Patterns](#animation-patterns)
7. [Accessibility Guidelines](#accessibility-guidelines)
8. [Implementation Checklist](#implementation-checklist)

---

## Overview

This design system implements a glassmorphism aesthetic with frosted-glass effects, semi-transparent surfaces, and subtle depth. The system is designed to work across web and mobile platforms with consistent visual language.

### Design Principles

- **Layered Depth**: Use blur and transparency to create visual hierarchy
- **Subtle Borders**: Semi-transparent borders define edges without harsh lines
- **Contextual Adaptation**: Adjust opacity and blur based on background complexity
- **Performance First**: Balance visual appeal with rendering performance

### Accent Color

Primary accent: `rgb(227, 83, 54)` / `#E35336`

---

## Core Properties

### Base Glassmorphism Effect

All glassmorphic elements should include these foundational properties:

```jsx
{
  background: "rgba(0, 0, 0, 0.3)",           // Semi-transparent background
  backdropFilter: "blur(12px)",               // Blur effect for elements behind
  WebkitBackdropFilter: "blur(12px)",         // Safari/iOS compatibility
  border: "2px solid rgba(227, 83, 54, 0.5)", // Semi-transparent border
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.4)" // Depth shadow
}
```

### Property Breakdown

| Property         | Purpose                      | Typical Range                                 | Notes                             |
| ---------------- | ---------------------------- | --------------------------------------------- | --------------------------------- |
| `background`     | Base color with transparency | `rgba(0,0,0,0.2)` - `rgba(0,0,0,0.5)`         | Adjust opacity for hierarchy      |
| `backdropFilter` | Blur strength                | `blur(8px)` - `blur(20px)`                    | Higher = more frosted             |
| `border`         | Edge definition              | `1px` - `2px`, opacity `0.1` - `0.5`          | Subtle borders work best          |
| `boxShadow`      | Depth & elevation            | Y-offset `8px` - `20px`, blur `32px` - `60px` | Larger shadows = higher elevation |

---

## Platform-Specific Considerations

### Web Implementation

**Browser Compatibility:**

- Always include `-webkit-` prefixed properties for Safari support
- Test in Chrome 76+, Safari 9+, Firefox 103+
- Provide fallback styles for older browsers

**Fallback Example:**

```jsx
style={{
  background: "rgba(0, 0, 0, 0.8)", // Fallback for no backdrop-filter support
  ...(CSS.supports('backdrop-filter', 'blur(12px)') && {
    background: "rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)"
  })
}}
```

### Mobile Implementation (React Native)

**Key Differences:**

- React Native doesn't support `backdrop-filter` directly
- Use `BlurView` component from `@react-native-community/blur` or `expo-blur`
- Apply opacity to achieve glass effect

**Example with expo-blur:**

```jsx
import { BlurView } from "expo-blur";

<BlurView
  intensity={80}
  tint={theme === "dark" ? "dark" : "light"}
  style={{
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(227, 83, 54, 0.5)",
    overflow: "hidden",
    ...shadowStyles,
  }}
>
  {/* Content */}
</BlurView>;
```

**Shadow Styles (iOS/Android):**

```jsx
// iOS
shadowColor: "#000",
shadowOffset: { width: 0, height: 8 },
shadowOpacity: 0.4,
shadowRadius: 16,

// Android
elevation: 12
```

### Performance Considerations

**Web:**

- Limit the number of glassmorphic elements on screen (< 10 simultaneous)
- Avoid animating `backdrop-filter` (very expensive)
- Use `will-change: transform` for animated elements only
- Remove `will-change` after animation completes

**Mobile:**

- BlurView is GPU-intensive; minimize nested blur components
- Use lower intensity values (40-80) on lower-end devices
- Consider reducing blur on Android for better performance
- Test on actual devices, not just simulators

---

## Component Library

### 1. Card (Standard)

**Use Case:** Default container for content blocks

**Web Implementation:**

```jsx
<div
  className="rounded-2xl p-4 overflow-hidden"
  style={{
    background:
      theme === "light" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border:
      theme === "light"
        ? "2px solid rgba(0, 0, 0, 0.1)"
        : "2px solid rgba(255, 255, 255, 0.1)",
    boxShadow:
      theme === "light"
        ? "0 8px 32px 0 rgba(0, 0, 0, 0.15)"
        : "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
  }}
>
  {/* Content */}
</div>
```

**Mobile Implementation:**

```jsx
<BlurView
  intensity={theme === "light" ? 60 : 80}
  tint={theme === "light" ? "light" : "dark"}
  style={{
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor:
      theme === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
    overflow: "hidden",
    // Shadow styles here
  }}
>
  {/* Content */}
</BlurView>
```

---

### 2. Interactive Card (Clickable/Hoverable)

**Use Case:** Cards with hover states and click interactions

**States:**

- Default
- Hover (web) / Press (mobile)
- Active/Selected

**Web Implementation:**

```jsx
<div
  className="rounded-2xl p-4 overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl relative"
  style={{
    background:
      theme === "light" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border:
      theme === "light"
        ? "2px solid rgba(0, 0, 0, 0.1)"
        : "2px solid rgba(255, 255, 255, 0.1)",
    boxShadow:
      theme === "light"
        ? "0 8px 32px 0 rgba(0, 0, 0, 0.15)"
        : "0 8px 32px 0 rgba(0, 0, 0, 0.3)",
  }}
>
  {/* Content */}

  {/* Hover glow overlay */}
  <div
    className="absolute inset-0 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
    style={{
      boxShadow: "0 0 20px rgba(227, 83, 54, 0.4)",
    }}
  />
</div>
```

**Mobile Implementation:**

```jsx
import { Pressable } from "react-native";

<Pressable
  onPress={handlePress}
  style={({ pressed }) => ({
    transform: [{ scale: pressed ? 0.98 : 1 }],
    opacity: pressed ? 0.9 : 1,
  })}
>
  <BlurView
    intensity={80}
    tint={theme === "light" ? "light" : "dark"}
    style={{
      borderRadius: 16,
      padding: 16,
      borderWidth: 2,
      borderColor:
        theme === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
      overflow: "hidden",
      // Shadow styles
    }}
  >
    {/* Content */}
  </BlurView>
</Pressable>;
```

---

### 3. Active/Live State Card

**Use Case:** Cards displaying live or active status (e.g., live stream indicator)

**Visual Characteristics:**

- Accent-colored border (rgba(227, 83, 54, 0.5))
- Enhanced glow effect
- Slightly more opaque background
- Optional pulsing animation

**Web Implementation:**

```jsx
<div
  className="rounded-2xl p-4 overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:scale-105 hover:shadow-2xl relative"
  style={{
    background:
      theme === "light" ? "rgba(255, 255, 255, 0.5)" : "rgba(0, 0, 0, 0.3)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "2px solid rgba(227, 83, 54, 0.5)", // Accent border
    boxShadow:
      theme === "light"
        ? "0 8px 32px 0 rgba(227, 83, 54, 0.2), 0 8px 32px 0 rgba(0, 0, 0, 0.15)"
        : "0 8px 32px 0 rgba(227, 83, 54, 0.3), 0 8px 32px 0 rgba(0, 0, 0, 0.4)",
  }}
>
  {/* Content */}

  {/* Active glow overlay */}
  <div
    className="absolute inset-0 rounded-2xl opacity-100 pointer-events-none"
    style={{
      boxShadow: "0 0 20px rgba(227, 83, 54, 0.4)",
    }}
  />
</div>
```

**Optional Pulse Animation (Web):**

```jsx
// Add to global CSS
@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 0 20px rgba(227, 83, 54, 0.4);
  }
  50% {
    box-shadow: 0 0 30px rgba(227, 83, 54, 0.6);
  }
}

// Apply to glow overlay
<div
  className="absolute inset-0 rounded-2xl pointer-events-none"
  style={{
    animation: "pulse-glow 2s ease-in-out infinite"
  }}
/>
```

---

### 4. Modal/Dialog

**Use Case:** Fullscreen or centered modal dialogs

**Components:**

- Backdrop (semi-transparent overlay)
- Modal card (main content container)
- Optional inner glow

**Web Implementation:**

```jsx
{
  /* Backdrop */
}
<div
  className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
  style={{
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
  }}
  onClick={handleBackdropClick}
>
  {/* Modal Card */}
  <div
    className="max-w-lg w-full rounded-3xl overflow-hidden relative"
    style={{
      background:
        theme === "light" ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.4)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      border: "2px solid rgba(227, 83, 54, 0.3)",
      boxShadow: "0 20px 60px 0 rgba(0, 0, 0, 0.5)",
    }}
    onClick={(e) => e.stopPropagation()}
  >
    {/* Inner glow */}
    <div
      className="absolute inset-0 rounded-3xl opacity-50 pointer-events-none"
      style={{
        boxShadow: "inset 0 0 40px rgba(227, 83, 54, 0.1)",
      }}
    />

    {/* Content */}
    <div className="relative z-10 p-6">{/* Modal content */}</div>
  </div>
</div>;
```

**Mobile Implementation:**

```jsx
import { Modal, View, TouchableOpacity } from "react-native";

<Modal
  visible={isVisible}
  transparent
  animationType="fade"
  onRequestClose={handleClose}
>
  {/* Backdrop */}
  <TouchableOpacity
    activeOpacity={1}
    onPress={handleBackdropPress}
    style={{
      flex: 1,
      backgroundColor: "rgba(0, 0, 0, 0.6)",
      justifyContent: "center",
      alignItems: "center",
      padding: 16,
    }}
  >
    {/* Modal Card */}
    <TouchableOpacity activeOpacity={1}>
      <BlurView
        intensity={100}
        tint={theme === "light" ? "light" : "dark"}
        style={{
          borderRadius: 24,
          borderWidth: 2,
          borderColor: "rgba(227, 83, 54, 0.3)",
          overflow: "hidden",
          maxWidth: 400,
          // Shadow styles
        }}
      >
        <View style={{ padding: 24 }}>{/* Modal content */}</View>
      </BlurView>
    </TouchableOpacity>
  </TouchableOpacity>
</Modal>;
```

---

### 5. Navigation Bar / Header

**Use Case:** Top or bottom navigation bars

**Web Implementation:**

```jsx
<header
  className="sticky top-0 z-50 w-full"
  style={{
    background:
      theme === "light" ? "rgba(255, 255, 255, 0.7)" : "rgba(0, 0, 0, 0.4)",
    backdropFilter: "blur(16px)",
    WebkitBackdropFilter: "blur(16px)",
    borderBottom:
      theme === "light"
        ? "1px solid rgba(0, 0, 0, 0.1)"
        : "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow: "0 4px 16px 0 rgba(0, 0, 0, 0.1)",
  }}
>
  {/* Navigation content */}
</header>
```

**Mobile Implementation:**

```jsx
<BlurView
  intensity={theme === "light" ? 70 : 90}
  tint={theme === "light" ? "light" : "dark"}
  style={{
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderBottomWidth: 1,
    borderBottomColor:
      theme === "light" ? "rgba(0, 0, 0, 0.1)" : "rgba(255, 255, 255, 0.1)",
    // Add safe area padding
    paddingTop: safeAreaInsets.top,
  }}
>
  {/* Navigation content */}
</BlurView>
```

---

### 6. Button (Glassmorphic)

**Use Case:** Primary and secondary action buttons

**Web Implementation:**

```jsx
<button
  className="px-6 py-3 rounded-xl font-medium transition-all duration-200 hover:scale-105 active:scale-95"
  style={{
    background: "rgba(227, 83, 54, 0.2)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: "2px solid rgba(227, 83, 54, 0.5)",
    boxShadow: "0 4px 16px 0 rgba(227, 83, 54, 0.2)",
    color: theme === "light" ? "#000" : "#fff",
  }}
>
  Button Text
</button>
```

**Mobile Implementation:**

```jsx
<Pressable
  onPress={handlePress}
  style={({ pressed }) => ({
    transform: [{ scale: pressed ? 0.95 : 1 }],
  })}
>
  <BlurView
    intensity={60}
    tint={theme === "light" ? "light" : "dark"}
    style={{
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 24,
      borderWidth: 2,
      borderColor: "rgba(227, 83, 54, 0.5)",
      overflow: "hidden",
      backgroundColor: "rgba(227, 83, 54, 0.2)",
    }}
  >
    <Text
      style={{
        fontWeight: "600",
        color: theme === "light" ? "#000" : "#fff",
      }}
    >
      Button Text
    </Text>
  </BlurView>
</Pressable>
```

---

## Theme System

### Color Variables

Define these color constants in your theme configuration:

```javascript
// Theme configuration
export const colors = {
  accent: {
    rgb: "rgb(227, 83, 54)",
    rgba: (opacity) => `rgba(227, 83, 54, ${opacity})`,
  },
  light: {
    glass: "rgba(255, 255, 255, 0.5)",
    glassDark: "rgba(255, 255, 255, 0.7)",
    border: "rgba(0, 0, 0, 0.1)",
    borderStrong: "rgba(0, 0, 0, 0.15)",
    shadow: "rgba(0, 0, 0, 0.15)",
    text: "#000000",
    textSecondary: "#666666",
  },
  dark: {
    glass: "rgba(0, 0, 0, 0.3)",
    glassDark: "rgba(0, 0, 0, 0.4)",
    border: "rgba(255, 255, 255, 0.1)",
    borderStrong: "rgba(255, 255, 255, 0.15)",
    shadow: "rgba(0, 0, 0, 0.4)",
    text: "#FFFFFF",
    textSecondary: "#AAAAAA",
  },
};
```

### Theme Helper Functions

```javascript
// Get glassmorphism styles based on current theme
export const getGlassStyles = (theme, variant = "default") => {
  const isLight = theme === "light";
  const themeColors = isLight ? colors.light : colors.dark;

  const variants = {
    default: {
      background: themeColors.glass,
      border: themeColors.border,
      shadow: `0 8px 32px 0 ${themeColors.shadow}`,
    },
    strong: {
      background: themeColors.glassDark,
      border: themeColors.borderStrong,
      shadow: `0 12px 40px 0 ${themeColors.shadow}`,
    },
    accent: {
      background: themeColors.glass,
      border: colors.accent.rgba(0.5),
      shadow: `0 8px 32px 0 ${colors.accent.rgba(0.2)}, 0 8px 32px 0 ${
        themeColors.shadow
      }`,
    },
  };

  return {
    ...variants[variant],
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
  };
};
```

### Blur Intensity Hierarchy

Use consistent blur values for visual hierarchy:

| Element Type     | Blur Intensity | Use Case                              |
| ---------------- | -------------- | ------------------------------------- |
| Backdrop overlay | `blur(8px)`    | Modal backgrounds, page overlays      |
| Standard card    | `blur(12px)`   | Default content containers            |
| Navigation       | `blur(16px)`   | Headers, nav bars (need more clarity) |
| Modal/Dialog     | `blur(20px)`   | Important overlays requiring focus    |

---

## Animation Patterns

### Entrance Animations

**Fade + Slide Up:**

```jsx
// Web
const [isVisible, setIsVisible] = useState(false);

<div
  className={`transition-all duration-500 ease-out ${
    isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
  }`}
>
  {/* Content */}
</div>;

// Mobile (React Native)
import { Animated } from "react-native";

const fadeAnim = useRef(new Animated.Value(0)).current;
const slideAnim = useRef(new Animated.Value(20)).current;

useEffect(() => {
  Animated.parallel([
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }),
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
    }),
  ]).start();
}, []);

<Animated.View
  style={{
    opacity: fadeAnim,
    transform: [{ translateY: slideAnim }],
  }}
>
  {/* Content */}
</Animated.View>;
```

**Modal Scale-In:**

```jsx
// Web
<div
  className={`transition-all duration-300 ${
    isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
  }`}
>
  {/* Modal content */}
</div>;

// Mobile
const scaleAnim = useRef(new Animated.Value(0.95)).current;

Animated.spring(scaleAnim, {
  toValue: 1,
  tension: 50,
  friction: 7,
  useNativeDriver: true,
}).start();
```

### Interaction Animations

**Hover Effects (Web only):**

```css
.glass-card {
  transition: all 300ms ease-out;
}

.glass-card:hover {
  transform: scale(1.05);
  box-shadow: 0 12px 40px 0 rgba(0, 0, 0, 0.3);
}

/* Avoid animating backdrop-filter - very expensive! */
```

**Press Effects (Mobile):**

```jsx
<Pressable
  onPress={handlePress}
  style={({ pressed }) => ({
    transform: [{ scale: pressed ? 0.98 : 1 }],
    opacity: pressed ? 0.9 : 1,
  })}
>
  {/* Content */}
</Pressable>
```

### Loading States

**Shimmer Effect:**

```jsx
// Web
@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

<div
  style={{
    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent)',
    backgroundSize: '1000px 100%',
    animation: 'shimmer 2s infinite'
  }}
/>

// Mobile
import { LinearGradient } from 'expo-linear-gradient';

<Animated.View style={{ transform: [{ translateX: shimmerAnim }] }}>
  <LinearGradient
    colors={['transparent', 'rgba(255, 255, 255, 0.1)', 'transparent']}
    start={{ x: 0, y: 0 }}
    end={{ x: 1, y: 0 }}
    style={{ width: '100%', height: '100%' }}
  />
</Animated.View>
```

---

## Accessibility Guidelines

### Color Contrast

**Ensure text readability on glass surfaces:**

- Minimum contrast ratio: 4.5:1 for normal text
- Use darker/lighter backgrounds behind text when needed
- Test with both light and dark themes

**Text Enhancement:**

```jsx
// Add subtle text shadow for better legibility on glass
style={{
  textShadow: theme === "light"
    ? "0 1px 2px rgba(255, 255, 255, 0.8)"
    : "0 1px 2px rgba(0, 0, 0, 0.8)"
}}
```

### Focus States

**Web:**

```css
.glass-button:focus-visible {
  outline: 2px solid rgb(227, 83, 54);
  outline-offset: 2px;
}
```

**Mobile:**

```jsx
// Use react-native-accessibility-utils or built-in accessibility props
<Pressable
  accessible={true}
  accessibilityLabel="Open menu"
  accessibilityRole="button"
  accessibilityState={{ selected: isSelected }}
>
  {/* Content */}
</Pressable>
```

### Motion Preferences

**Respect reduced motion preferences:**

```jsx
// Web
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

<div className={prefersReducedMotion ? "" : "transition-all duration-300"}>
  {/* Content */}
</div>;

// Mobile
import { AccessibilityInfo } from "react-native";

const [isReduceMotionEnabled, setReduceMotionEnabled] = useState(false);

useEffect(() => {
  AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotionEnabled);
}, []);
```

---

## Implementation Checklist

### Initial Setup

**Web:**

- [ ] Install Tailwind CSS
- [ ] Configure theme system (CSS variables or JS constants)
- [ ] Add browser fallbacks for `backdrop-filter`
- [ ] Test in Safari, Chrome, and Firefox

**Mobile:**

- [ ] Install blur library (`expo-blur` or `@react-native-community/blur`)
- [ ] Set up theme context/provider
- [ ] Configure safe area handling
- [ ] Test on iOS and Android devices

### Component Development

- [ ] Create base glass card component
- [ ] Implement interactive card variant
- [ ] Build modal/dialog component
- [ ] Create navigation bar component
- [ ] Design button components
- [ ] Add entrance/exit animations
- [ ] Implement loading states

### Theme Integration

- [ ] Set up light/dark theme switching
- [ ] Create theme helper functions
- [ ] Define color constants
- [ ] Test all components in both themes

### Performance Optimization

- [ ] Limit number of glass elements per screen
- [ ] Avoid animating `backdrop-filter`
- [ ] Use `will-change` judiciously
- [ ] Test on lower-end devices
- [ ] Monitor frame rates during animations

### Accessibility

- [ ] Test color contrast ratios
- [ ] Add focus indicators
- [ ] Implement keyboard navigation (web)
- [ ] Add accessibility labels (mobile)
- [ ] Test with screen readers
- [ ] Respect reduced motion preferences

### Cross-Platform Testing

- [ ] Test on iOS devices
- [ ] Test on Android devices
- [ ] Test on various browsers (web)
- [ ] Verify consistent appearance
- [ ] Check performance on older devices

---

## Troubleshooting

### Common Issues

**Blur not working:**

- Ensure `-webkit-` prefix is included
- Check browser compatibility
- Verify element has background and overflow

**Performance issues:**

- Reduce number of blurred elements
- Lower blur intensity
- Avoid nesting multiple BlurViews (mobile)
- Don't animate backdrop-filter

**Border not visible:**

- Increase border opacity
- Ensure border color contrasts with background
- Check if overflow is clipping borders

**Shadow not showing:**

- Increase shadow opacity
- Check z-index/stacking context
- Ensure element isn't clipped by parent overflow

---

## Resources

### Dependencies

**Web:**

- Tailwind CSS: `npm install -D tailwindcss`

**Mobile:**

- Expo Blur: `npx expo install expo-blur`
- Community Blur: `npm install @react-native-community/blur`

### Useful Links

- [MDN: backdrop-filter](https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter)
- [Can I Use: backdrop-filter](https://caniuse.com/css-backdrop-filter)
- [Expo Blur Documentation](https://docs.expo.dev/versions/latest/sdk/blur-view/)
- [React Native Blur](https://github.com/Kureev/react-native-blur)

---

## Version History

- **v1.0** - Initial specification
- **v1.1** - Added mobile implementation details
- **v1.2** - Enhanced with theme system, accessibility, and troubleshooting sections
