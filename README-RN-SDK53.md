# Mobile Page Visions - React Native (Expo SDK 53)

This is the React Native version of the Mobile Page Visions app, upgraded to Expo SDK 53.

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Expo CLI (install globally with `npm install -g @expo/cli`)
- Expo Go app on your mobile device (for testing)

## Installation

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Clear cache (if needed):**
   ```bash
   npx expo install --fix
   ```

## Running the App

### Option 1: Using Expo Go (Recommended for quick testing)

1. **Start the development server:**
   ```bash
   npm start
   ```

2. **Scan the QR code:**
   - Install Expo Go on your mobile device
   - Scan the QR code that appears in the terminal or browser
   - The app will load on your device

### Option 2: Using Android Emulator

1. **Install Android Studio and set up an emulator**
2. **Start the development server:**
   ```bash
   npm run android
   ```

### Option 3: Using iOS Simulator (macOS only)

1. **Install Xcode**
2. **Start the development server:**
   ```bash
   npm run ios
   ```

### Option 4: Web Browser

```bash
npm run web
```

## Project Structure

- `AppRN.tsx` - Main app component with navigation
- `SignupPageRN.tsx` - Signup page component
- `RoleSelectionRN.tsx` - Role selection component
- `app.json` - Expo configuration
- `package.json` - Dependencies and scripts

## Key Features

- **Expo SDK 53** - Latest stable version
- **React Navigation 6** - For navigation between screens
- **Supabase Integration** - For backend services
- **TypeScript** - For type safety
- **Lucide React Native** - For icons

## Troubleshooting

### Common Issues

1. **Metro bundler issues:**
   ```bash
   npx expo start --clear
   ```

2. **Dependency conflicts:**
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

3. **Expo Go not connecting:**
   - Make sure your device and computer are on the same network
   - Try using tunnel mode: `npx expo start --tunnel`

### SDK 53 Specific Notes

- React Native 0.76.3
- React 18.3.1
- Enhanced performance and stability
- Better TypeScript support
- Improved development experience

## Development

The app is set up with:
- TypeScript for type safety
- React Navigation for screen navigation
- Supabase for backend integration
- Modern React Native patterns

## Building for Production

To build standalone apps:

```bash
# For Android
npx expo build:android

# For iOS
npx expo build:ios
```

Note: You'll need an Expo account and appropriate build credentials for production builds. 