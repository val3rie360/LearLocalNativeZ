# Dark Mode Implementation Guide

## Overview
Dark mode has been successfully implemented in the LearnLocal app. Users can now toggle between light and dark themes from the settings page.

## Features

### Theme System
- **Theme Context**: Centralized theme management via `ThemeContext`
- **Light & Dark Themes**: Complete color schemes for both modes
- **Persistent Storage**: Theme preference is saved using AsyncStorage
- **Auto Mode**: Automatically follows system theme (future enhancement)

### Color Scheme

#### Light Mode Colors
```typescript
{
  background: "#F6F4FE",      // Main background
  surface: "#FFFFFF",          // Card backgrounds
  primary: "#7D7CFF",         // Primary brand color
  secondary: "#4B2ACF",       // Secondary brand color
  text: "#18181B",            // Primary text
  textSecondary: "#6B7280",   // Secondary text
  border: "#E5E7EB",          // Borders and dividers
  error: "#EF4444",           // Error messages
  success: "#10B981",         // Success messages
  warning: "#F59E0B",         // Warning messages
  info: "#3B82F6",            // Info messages
}
```

#### Dark Mode Colors
```typescript
{
  background: "#0F0F23",      // Main background (dark)
  surface: "#1A1A2E",         // Card backgrounds (dark)
  primary: "#A5B4FC",         // Primary brand color (lighter)
  secondary: "#8B5CF6",       // Secondary brand color
  text: "#F9FAFB",           // Primary text (light)
  textSecondary: "#9CA3AF",  // Secondary text
  border: "#374151",         // Borders and dividers
  error: "#F87171",          // Error messages
  success: "#34D399",        // Success messages
  warning: "#FBBF24",        // Warning messages
  info: "#60A5FA",           // Info messages
}
```

## Usage

### Using Theme in Components

```typescript
import { useTheme } from "../contexts/ThemeContext";

function MyComponent() {
  const { isDark, theme } = useTheme();

  return (
    <View style={{ backgroundColor: theme.background }}>
      <Text style={{ color: theme.text }}>
        Hello World
      </Text>
    </View>
  );
}
```

### Theme Provider Setup

The ThemeProvider is already wrapped around the app in `app/_layout.tsx`:

```typescript
<ThemeProvider>
  <AuthProvider>
    <RootLayoutNav />
  </AuthProvider>
</ThemeProvider>
```

### Settings Page Integration

The dark mode toggle is already integrated in `app/settings.tsx`:

```typescript
const { isDark, theme, toggleTheme } = useTheme();

<Switch
  value={isDark}
  onValueChange={toggleTheme}
  trackColor={{ false: theme.border, true: theme.primary }}
  thumbColor="#fff"
/>
```

## Implementation Status

### ✅ Completed
- Theme context created
- Theme provider integrated
- Settings page toggle functional
- Theme preference persisted
- Dark mode toggle working

### 🔄 In Progress
- Updating individual components to use theme colors
- Applying dark mode across all screens

### 📋 To Do
- Update remaining components to use theme
- Test dark mode across all screens
- Add auto mode (follow system theme)
- Update app splash screen for dark mode

## How to Add Dark Mode to Components

### Step 1: Import useTheme
```typescript
import { useTheme } from "../contexts/ThemeContext";
```

### Step 2: Get Theme Colors
```typescript
const { isDark, theme } = useTheme();
```

### Step 3: Apply Theme Colors
```typescript
// Instead of hardcoded colors:
<View style={{ backgroundColor: '#F6F4FE' }}>

// Use theme colors:
<View style={{ backgroundColor: theme.background }}>

// Or with Tailwind + inline styles:
<View className="p-4" style={{ backgroundColor: theme.surface }}>
  <Text style={{ color: theme.text }}>Hello</Text>
</View>
```

## Available Theme Colors

Access any color from the theme:

```typescript
theme.background      // Main background color
theme.surface         // Card/surface background
theme.primary         // Primary brand color
theme.secondary       // Secondary brand color
theme.text            // Primary text color
theme.textSecondary   // Secondary text color
theme.border          // Border and divider color
theme.error           // Error color
theme.success         // Success color
theme.warning         // Warning color
theme.info            // Info color
```

## Testing Dark Mode

1. Open the app
2. Go to Profile → Settings
3. Toggle "Dark Mode" switch
4. The entire app should switch to dark theme
5. Close and reopen the app
6. Theme preference should be preserved

## Troubleshooting

### Theme not updating
- Check if `useTheme()` is being called
- Verify ThemeProvider is wrapped in `_layout.tsx`
- Clear app cache and restart

### Colors not changing
- Ensure using `theme.{colorName}` instead of hardcoded colors
- Check if inline styles are overriding theme
- Verify Tailwind classes aren't overriding styles

### Toggle not working
- Check if `toggleTheme` is called on switch
- Verify AsyncStorage permissions
- Clear AsyncStorage and retry

## Best Practices

1. **Use theme colors**: Always use `theme.{colorName}` instead of hardcoded colors
2. **Consistent styling**: Mix Tailwind classes with inline theme styles
3. **Test both themes**: Always test components in both light and dark modes
4. **Accessibility**: Ensure sufficient contrast in both themes
5. **Performance**: Theme changes are optimized and smooth

## Future Enhancements

- Auto mode that follows system theme
- More color variations
- Custom theme creation
- Theme preview
- Automatic dark mode timing

