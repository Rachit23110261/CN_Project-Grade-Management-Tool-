@echo off
setlocal

rem Grade Management Tool Docker Helper Script for Windows

if "%1"=="" goto help
if "%1"=="help" goto help
if "%1"=="--help" goto help
if "%1"=="-h" goto help

if "%1"=="start" goto start_production
if "%1"=="start-dev" goto start_development
if "%1"=="stop" goto stop_application
if "%1"=="restart" goto restart_application
if "%1"=="logs" goto show_logs
if "%1"=="status" goto show_status
if "%1"=="build" goto build_containers
if "%1"=="clean" goto clean_all
if "%1"=="backup" goto backup_database
if "%1"=="shell" goto backend_shell
if "%1"=="db-shell" goto database_shell

echo Error: Unknown command '%1'
goto help

:help
echo Grade Management Tool - Docker Helper Script
echo.
echo Usage: %0 [COMMAND]
echo.
echo Commands:
echo   start        Start the application (production)
echo   start-dev    Start the application (development)
echo   stop         Stop the application
echo   restart      Restart the application
echo   logs         Show application logs
echo   status       Show container status
echo   build        Rebuild containers
echo   clean        Stop and remove containers, networks, and volumes
echo   backup       Backup database
echo   shell        Open shell in backend container
echo   db-shell     Open database shell
echo   help         Show this help message
echo.
echo Examples:
echo   %0 start
echo   %0 logs
echo   %0 backup ^> backup.sql
goto end

:start_production
echo Starting Grade Management Tool (Production)...
if not exist server\.env (
    echo Warning: server\.env not found. Copying from .env.example...
    copy server\.env.example server\.env
    echo Please edit server\.env and configure your settings before continuing.
    goto end
)
docker-compose up -d
echo Application started successfully!
echo Frontend: http://localhost
echo Backend:  http://localhost:5000
echo Database: localhost:5432
goto end

:start_development
echo Starting Grade Management Tool (Development)...
docker-compose -f docker-compose.dev.yml up -d
echo Development environment started successfully!
echo Frontend: http://localhost (run 'npm run dev' in client folder)
echo Backend:  http://localhost:5000
echo Database: localhost:5432
goto end

:stop_application
echo Stopping Grade Management Tool...
docker-compose down
docker-compose -f docker-compose.dev.yml down 2>nul
echo Application stopped successfully!
goto end

:restart_application
echo Restarting Grade Management Tool...
docker-compose restart
echo Application restarted successfully!
goto end

:show_logs
if "%2"=="" (
    docker-compose logs -f
) else (
    docker-compose logs -f %2
)
goto end

:show_status
echo Container Status:
docker-compose ps
echo.
echo Resource Usage:
docker stats --no-stream
goto end

:build_containers
echo Building containers...
docker-compose build --no-cache
echo Build completed successfully!
goto end

:clean_all
echo WARNING: This will remove all containers, networks, and volumes!
echo All data will be lost!
set /p confirm="Are you sure? (y/N): "
if /i "%confirm%"=="y" (
    echo Cleaning up...
    docker-compose down -v --remove-orphans
    docker-compose -f docker-compose.dev.yml down -v --remove-orphans 2>nul
    docker system prune -f
    echo Cleanup completed!
) else (
    echo Cleanup cancelled.
)
goto end

:backup_database
echo Backing up database...
docker-compose exec -T database pg_dump -U postgres grade_management
echo Database backup completed!
goto end

:backend_shell
echo Opening backend container shell...
docker-compose exec backend sh
goto end

:database_shell
echo Opening database shell...
docker-compose exec database psql -U postgres grade_management
goto end

:end
endlocal