@echo off
echo ========================================
echo Firebase Deployment Script
echo ========================================
echo.

echo Step 1: Building Next.js project...
call npm run build
if %errorlevel% neq 0 (
    echo Build failed! Please fix errors and try again.
    pause
    exit /b %errorlevel%
)
echo Build completed successfully!
echo.

echo Step 2: Deploying to Firebase...
call firebase deploy --only hosting,firestore:rules,firestore:indexes
if %errorlevel% neq 0 (
    echo Deployment failed! Please check your Firebase configuration.
    pause
    exit /b %errorlevel%
)
echo.

echo ========================================
echo Deployment completed successfully!
echo ========================================
echo.
echo Your site is now live at:
echo https://eventcash-74a3a.web.app
echo https://eventcash-74a3a.firebaseapp.com
echo.
pause
