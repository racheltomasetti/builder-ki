Build Plan: Mandala Customization Feature

Architecture Overview

New Components:

1. MandalaCustomizeButton.tsx - Floating glassmorphic button (top right)
2. MandalaCustomizeModal.tsx - Glassmorphic modal with all controls
3. ColorPicker.tsx - Color wheel picker component

State Management:

- Create a custom hook useMandalaSettings.ts to manage settings and AsyncStorage
  persistence
- Settings will be stored in AsyncStorage under key @mandala_settings

Modified Components:

- CaptureScreen.tsx - Add button, modal, and preview state management
- KIMandala.tsx - Accept dynamic props for customization

---

Data Structure

Default Mandala Settings:
{
color: "rgb(227, 83, 54)", // Accent color from glassmorphism docs
centerCircleColor: "rgb(227, 83, 54)",
layerSpacing: 36, // Base spacing between layers
logoSizeMultiplier: 1.0, // Affects logo sizes
logoCountMultiplier: 1.0, // Affects logos per layer
rotationSpeedMultiplier: 1.0, // Affects rotation speeds
isPreviewMode: false
}

Min/Max Values (we can adjust these):

- layerSpacing: 20-60 (controls how tight/loose the rings are)
- logoSizeMultiplier: 0.5-2.0 (smaller to larger logos)
- logoCountMultiplier: 0.5-2.0 (fewer to more logos per ring)
- rotationSpeedMultiplier: 0.3-3.0 (slower to faster rotation)

---

Component Details

1. MandalaCustomizeButton (Floating Button)

- Position: Absolute, top right, below header
- Glassmorphic styling per docs (blur(12px), semi-transparent)
- Icon: Settings/customize icon
- Hidden when recording === true
- Opens modal on press

2. MandalaCustomizeModal

- Full-screen modal with glassmorphic backdrop (blur(8px))
- Centered glassmorphic card (blur(20px) per modal specs)
- Scrollable content with sections:
  - Preview Toggle (switch at top)
  - Color Section (color picker for all layers + center circle)
  - Layer Spacing (slider with label showing value)
  - Logo Size (slider)
  - Logo Count (slider)
  - Rotation Speed (slider)
  - Action Buttons (Reset to Default + Close)

3. ColorPicker

- Use library: react-native-color-picker or react-native-wheel-color-picker
- Glassmorphic container
- Returns RGB string format

---

Implementation Flow

Phase 1: Setup & Structure

1. Create useMandalaSettings.ts hook with AsyncStorage integration
2. Create default constants file for mandala settings
3. Update KIMandala.tsx to accept all dynamic props

Phase 2: UI Components 4. Build MandalaCustomizeButton.tsx with glassmorphic styling 5. Build MandalaCustomizeModal.tsx with all controls 6. Integrate ColorPicker library and create wrapper

Phase 3: Integration 7. Add button and modal to CaptureScreen.tsx 8. Wire up preview mode (shows spinning mandala without recording) 9. Connect all sliders to mandala props 10. Implement reset to defaults

Phase 4: Persistence 11. Load settings on app mount 12. Save settings on every change (debounced) 13. Test persistence across app restarts

---

Technical Decisions

Color Picker Library:
I recommend react-native-wheel-color-picker - it's lightweight and works well with Expo.

Slider Component:
Use @react-native-community/slider - standard and reliable.

Preview Mode Logic:

- When preview toggle is ON: Show mandala with spinning layers (same visual as
  recording) but don't start audio recording
- This is separate from actual recording state

Performance Considerations:

- Debounce slider value changes (300ms) before updating mandala
- Use useCallback and memo to prevent unnecessary re-renders
- Only persist to AsyncStorage after user stops adjusting (debounced save)

---

File Structure

mobile/
├── components/
│ ├── KIMandala.tsx (modified)
│ ├── MandalaCustomizeButton.tsx (new)
│ ├── MandalaCustomizeModal.tsx (new)
│ └── ColorPicker.tsx (new)
├── hooks/
│ └── useMandalaSettings.ts (new)
├── constants/
│ └── mandalaDefaults.ts (new)
└── screens/
└── CaptureScreen.tsx (modified)

---

Glassmorphism Styling Reference

Per your docs, we'll use:

- Button: Modal section styles (blur 12px, accent border)
- Modal backdrop: blur(8px), rgba(0,0,0,0.6)
- Modal card: blur(20px), accent border rgba(227,83,54,0.3)
- Control containers: blur(12px), standard borders

---

Questions Before We Build

1. Color picker library - Are you okay with installing react-native-wheel-color-picker,  
   or would you prefer a different one?
2. Slider library - Should I use @react-native-community/slider or does your project  
   already have a slider component?
3. Icon for the floating button - Do you have an icon library installed (like
   @expo/vector-icons)? What icon would you like? (e.g., sliders icon, settings gear,
   palette icon)
4. Modal close behavior - Should tapping the backdrop close the modal, or only the
   "Close" button?
5. Immediate apply vs Apply button - Should changes apply to the mandala immediately as  
   the user adjusts sliders, or should there be an "Apply" button?

Let me know your preferences on these and we can start building! 🚀
