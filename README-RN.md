# Mobile Page Visions - React Native

This is the React Native version of the Mobile Page Visions app, converted from the web version.

## Setup Instructions

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator (for iOS development) or Android Studio (for Android development)

### Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Install Expo CLI globally (if not already installed):**
   ```bash
   npm install -g @expo/cli
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```

4. **Run on device/simulator:**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan QR code with Expo Go app on your phone

## Project Structure

```
├── SignupPageRN.tsx          # React Native Signup Page
├── RoleSelectionRN.tsx       # React Native Role Selection
├── AppRN.tsx                 # Main App with Navigation
├── package.json              # Dependencies
└── README-RN.md             # This file
```

## Key Changes from Web Version

### Components Converted
- **SignupPage**: Converted from web components to React Native
  - `<div>` → `<View>`
  - `<input>` → `<TextInput>`
  - `<button>` → `<TouchableOpacity>`
  - CSS classes → StyleSheet objects
  - `toast()` → `Alert.alert()`

- **RoleSelection**: Role selection screen after signup
  - Touch-based interactions
  - Mobile-optimized layout

- **Navigation**: Using React Navigation instead of React Router
  - Stack navigation for screen transitions
  - Mobile navigation patterns

### Styling
- Replaced Tailwind CSS with React Native StyleSheet
- Used Flexbox for layouts (same as web but with different syntax)
- Mobile-optimized colors and spacing

### Dependencies
- `@react-navigation/native` & `@react-navigation/stack` for navigation
- `lucide-react-native` for icons
- `@supabase/supabase-js` for backend (same as web)
- `expo` for development and building

## Next Steps

To complete the React Native conversion, you'll need to:

1. **Create LoginPageRN.tsx** - Convert the login page
2. **Create BuyerDashboardRN.tsx** - Convert the buyer dashboard
3. **Create SellerDashboardRN.tsx** - Convert the seller dashboard
4. **Create modal components** - Convert all modals to React Native Modal
5. **Add proper navigation** - Complete the navigation flow
6. **Test on both platforms** - iOS and Android

## Development Tips

- Use `console.log()` for debugging (shows in Expo DevTools)
- Test on both iOS and Android regularly
- Use Expo's hot reload for faster development
- Consider using React Native Paper for additional UI components

## Building for Production

```bash
# Build for iOS
expo build:ios

# Build for Android
expo build:android

# Or use EAS Build (recommended)
eas build --platform ios
eas build --platform android
```

## Notes

- The Supabase configuration remains the same as the web version
- All business logic (API calls, validation) is preserved
- UI is adapted for mobile touch interactions
- Navigation follows mobile app patterns 