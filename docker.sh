#!/bin/bash

# Grade Management Tool Docker Helper Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_color() {
    printf "${1}${2}${NC}\n"
}

# Function to check if Docker is running
check_docker() {
    if ! docker info > /dev/null 2>&1; then
        print_color $RED "Error: Docker is not running. Please start Docker and try again."
        exit 1
    fi
}

# Function to check if docker-compose is available
check_compose() {
    if ! command -v docker-compose > /dev/null 2>&1; then
        print_color $RED "Error: docker-compose is not installed. Please install it and try again."
        exit 1
    fi
}

# Function to display help
show_help() {
    print_color $BLUE "Grade Management Tool - Docker Helper Script"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start        Start the application (production)"
    echo "  start-dev    Start the application (development)"
    echo "  stop         Stop the application"
    echo "  restart      Restart the application"
    echo "  logs         Show application logs"
    echo "  status       Show container status"
    echo "  build        Rebuild containers"
    echo "  clean        Stop and remove containers, networks, and volumes"
    echo "  backup       Backup database"
    echo "  restore      Restore database from backup"
    echo "  shell        Open shell in backend container"
    echo "  db-shell     Open database shell"
    echo "  help         Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 start"
    echo "  $0 logs backend"
    echo "  $0 backup > backup.sql"
}

# Function to start production environment
start_production() {
    print_color $GREEN "Starting Grade Management Tool (Production)..."
    check_docker
    check_compose
    
    if [ ! -f server/.env ]; then
        print_color $YELLOW "Warning: server/.env not found. Copying from .env.example..."
        cp server/.env.example server/.env
        print_color $YELLOW "Please edit server/.env and configure your settings before continuing."
        exit 1
    fi
    
    docker-compose up -d
    print_color $GREEN "Application started successfully!"
    print_color $BLUE "Frontend: http://localhost"
    print_color $BLUE "Backend:  http://localhost:5000"
    print_color $BLUE "Database: localhost:5432"
}

# Function to start development environment
start_development() {
    print_color $GREEN "Starting Grade Management Tool (Development)..."
    check_docker
    check_compose
    
    docker-compose -f docker-compose.dev.yml up -d
    print_color $GREEN "Development environment started successfully!"
    print_color $BLUE "Frontend: http://localhost (run 'npm run dev' in client folder)"
    print_color $BLUE "Backend:  http://localhost:5000"
    print_color $BLUE "Database: localhost:5432"
}

# Function to stop application
stop_application() {
    print_color $YELLOW "Stopping Grade Management Tool..."
    docker-compose down
    docker-compose -f docker-compose.dev.yml down 2>/dev/null || true
    print_color $GREEN "Application stopped successfully!"
}

# Function to restart application
restart_application() {
    print_color $YELLOW "Restarting Grade Management Tool..."
    docker-compose restart
    print_color $GREEN "Application restarted successfully!"
}

# Function to show logs
show_logs() {
    if [ -n "$2" ]; then
        docker-compose logs -f "$2"
    else
        docker-compose logs -f
    fi
}

# Function to show status
show_status() {
    print_color $BLUE "Container Status:"
    docker-compose ps
    echo ""
    print_color $BLUE "Resource Usage:"
    docker stats --no-stream
}

# Function to build containers
build_containers() {
    print_color $YELLOW "Building containers..."
    docker-compose build --no-cache
    print_color $GREEN "Build completed successfully!"
}

# Function to clean everything
clean_all() {
    print_color $RED "WARNING: This will remove all containers, networks, and volumes!"
    print_color $RED "All data will be lost!"
    read -p "Are you sure? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        print_color $YELLOW "Cleaning up..."
        docker-compose down -v --remove-orphans
        docker-compose -f docker-compose.dev.yml down -v --remove-orphans 2>/dev/null || true
        docker system prune -f
        print_color $GREEN "Cleanup completed!"
    else
        print_color $GREEN "Cleanup cancelled."
    fi
}

# Function to backup database
backup_database() {
    print_color $YELLOW "Backing up database..."
    docker-compose exec -T database pg_dump -U postgres grade_management
    print_color $GREEN "Database backup completed!"
}

# Function to restore database
restore_database() {
    if [ -z "$2" ]; then
        print_color $RED "Error: Please specify backup file"
        print_color $BLUE "Usage: $0 restore <backup_file>"
        exit 1
    fi
    
    print_color $YELLOW "Restoring database from $2..."
    cat "$2" | docker-compose exec -T database psql -U postgres grade_management
    print_color $GREEN "Database restore completed!"
}

# Function to open backend shell
backend_shell() {
    print_color $BLUE "Opening backend container shell..."
    docker-compose exec backend sh
}

# Function to open database shell
database_shell() {
    print_color $BLUE "Opening database shell..."
    docker-compose exec database psql -U postgres grade_management
}

# Main script logic
case "$1" in
    "start")
        start_production
        ;;
    "start-dev")
        start_development
        ;;
    "stop")
        stop_application
        ;;
    "restart")
        restart_application
        ;;
    "logs")
        show_logs "$@"
        ;;
    "status")
        show_status
        ;;
    "build")
        build_containers
        ;;
    "clean")
        clean_all
        ;;
    "backup")
        backup_database
        ;;
    "restore")
        restore_database "$@"
        ;;
    "shell")
        backend_shell
        ;;
    "db-shell")
        database_shell
        ;;
    "help"|"--help"|"-h"|"")
        show_help
        ;;
    *)
        print_color $RED "Error: Unknown command '$1'"
        echo ""
        show_help
        exit 1
        ;;
esac