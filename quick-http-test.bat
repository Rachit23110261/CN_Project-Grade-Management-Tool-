@echo off
echo Testing HTTP fallback...

echo Stopping servers...
taskkill /f /im node.exe >nul 2>&1

echo Setting environment for HTTP testing...
cd /d "c:\Users\rachi\Desktop\rachit1st\5th sem\CN\project\server"
set USE_HTTPS=false
set NODE_ENV=development

echo Starting backend on HTTP...
start "Backend" cmd /c "npm start"

timeout /t 3

cd /d "c:\Users\rachi\Desktop\rachit1st\5th sem\CN\project\client"

echo Creating temp .env for HTTP...
echo VITE_API_URL=http://10.7.4.228:5000/api > .env.temp
echo VITE_USE_HTTPS=false >> .env.temp

echo Starting frontend on HTTP...
start "Frontend" cmd /c "npm run dev -- --host 127.0.0.1 --port 5173"

echo Testing complete. Check if login works now.
echo If it works, the issue is with HTTPS configuration.
echo Press any key to restore HTTPS settings...
pause

echo Restoring original settings...
del .env.temp
copy .env.backup .env >nul 2>&1

echo Restarting with HTTPS...
taskkill /f /im node.exe >nul 2>&1

cd /d "c:\Users\rachi\Desktop\rachit1st\5th sem\CN\project\server"
set USE_HTTPS=true
start "Backend HTTPS" cmd /c "npm start"

timeout /t 3

cd /d "c:\Users\rachi\Desktop\rachit1st\5th sem\CN\project\client"
start "Frontend HTTPS" cmd /c "npm run dev -- --host 127.0.0.1 --port 5173 --https"