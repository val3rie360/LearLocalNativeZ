@echo off
echo ========================================
echo Secure .env File Setup
echo ========================================
echo.

if exist .env (
    echo .env file already exists!
    echo.
    choice /C YN /M "Do you want to overwrite it"
    if errorlevel 2 goto :EOF
    echo.
)

echo Creating .env file from template...
copy env.template .env >nul

echo.
echo ✅ .env file created!
echo.
echo ========================================
echo NEXT STEPS:
echo ========================================
echo.
echo 1. Open .env in your text editor
echo.
echo 2. Replace 'your-cloud-name-here' with your actual Cloudinary cloud name
echo    Get it from: https://console.cloudinary.com/
echo.
echo 3. Save the file
echo.
echo 4. Restart your app: npx expo start --clear
echo.
echo ========================================
echo SECURITY REMINDER:
echo ========================================
echo.
echo ✅ Only add cloud name and upload preset
echo ❌ NEVER add API key or API secret with EXPO_PUBLIC_ prefix
echo ❌ NEVER commit .env to git
echo.
echo For help, see: Guides/CLOUDINARY_SETUP.md
echo ========================================
echo.
pause

