@echo off
setlocal

:: Helper script for deploying components

if "%1"=="" (
    call :print_usage
    exit /b 1
)

:parse_args
if "%1"=="--all" (
    echo Deploying all components...
    docker-compose -f docker-compose.compliance.yml up -d --build
    goto :end
)
if "%1"=="--backend" (
    echo Deploying backend, redis, and postgres...
    docker-compose -f docker-compose.compliance.yml up -d --build backend redis postgres
    goto :end
)
if "%1"=="--ui" (
    echo Deploying compliance UI only...
    docker-compose -f docker-compose.compliance.yml up -d --build compliance_ui
    goto :end
)
if "%1"=="--down" (
    echo Stopping all services...
    docker-compose -f docker-compose.compliance.yml down
    goto :end
)
if "%1"=="--help" (
    call :print_usage
    goto :end
)

echo Unknown option: %1
call :print_usage
exit /b 1

:print_usage
echo Usage: deploy.bat [OPTIONS]
echo Options:
echo   --all             Deploy all components (backend, compliance UI, redis, postgres)
echo   --backend         Deploy only the backend service
echo   --ui              Deploy only the compliance UI service
echo   --down            Stop all services
echo   --help            Show this help message
exit /b 0

:end
echo Deployment completed successfully.
exit /b 0
