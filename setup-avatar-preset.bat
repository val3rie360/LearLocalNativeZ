@echo off
REM Setup Avatar Upload Preset for Cloudinary
REM This script helps configure avatar uploads in your .env file

echo ============================================
echo   LearnLocal Avatar Upload Setup
echo ============================================
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env from env.template first:
    echo    copy env.template .env
    echo.
    pause
    exit /b 1
)

echo Current .env configuration:
echo.
findstr /C:"EXPO_PUBLIC_CLOUDINARY" .env
echo.
echo ============================================
echo.

REM Check if AVATAR_UPLOAD_PRESET already exists
findstr /C:"EXPO_PUBLIC_CLOUDINARY_AVATAR_UPLOAD_PRESET" .env >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    echo INFO: EXPO_PUBLIC_CLOUDINARY_AVATAR_UPLOAD_PRESET already exists in .env
    echo.
    set /p update="Do you want to update it? (y/n): "
    if /i not "%update%"=="y" (
        echo Skipping update.
        pause
        exit /b 0
    )
) else (
    echo INFO: EXPO_PUBLIC_CLOUDINARY_AVATAR_UPLOAD_PRESET not found in .env
    echo Adding it now...
    echo.
    echo EXPO_PUBLIC_CLOUDINARY_AVATAR_UPLOAD_PRESET=learn_local_avatars >> .env
    echo ✓ Added EXPO_PUBLIC_CLOUDINARY_AVATAR_UPLOAD_PRESET to .env
    echo.
)

echo.
echo ============================================
echo   Next Steps:
echo ============================================
echo.
echo 1. Go to Cloudinary Console:
echo    https://console.cloudinary.com/settings/upload
echo.
echo 2. Create a NEW upload preset:
echo    - Name: learn_local_avatars
echo    - Signing Mode: Unsigned
echo    - Folder: avatars
echo    - Allowed formats: jpg, jpeg, png, webp
echo    - Transformations (recommended):
echo      * Width: 500, Height: 500, Crop: fill
echo      * Quality: auto
echo      * Format: auto
echo.
echo 3. Save the preset in Cloudinary
echo.
echo 4. Restart your Expo app:
echo    npx expo start --clear
echo.
echo ============================================
echo.
pause

