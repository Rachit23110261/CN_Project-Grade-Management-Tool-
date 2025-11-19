# Docker Deployment Guide

This guide explains how to deploy the Grade Management Tool using Docker containers.

## Prerequisites

- Docker installed on your system
- Docker Compose installed
- At least 2GB of free RAM
- Ports 80, 5000, and 5432 available

## Quick Start

### 1. Clone and Navigate
```bash
git clone <repository-url>
cd CN_Project-Grade-Management-Tool-
```

### 2. Environment Configuration
```bash
# Copy the example environment file
cp server/.env.example server/.env

# Edit the environment file
nano server/.env  # or use your preferred editor
```

**Important**: Update these values in `server/.env`:
- `JWT_SECRET`: Generate a strong secret (minimum 32 characters)
- `EMAIL_USER` and `EMAIL_PASS`: Your email credentials for password reset
- `DB_PASSWORD`: Change from default if deploying to production

### 3. Deploy with Docker Compose
```bash
# Production deployment
docker-compose up -d

# Development deployment (with hot reload)
docker-compose -f docker-compose.dev.yml up -d
```

### 4. Access the Application
- **Frontend**: http://localhost
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432 (only for external connections)

## Default Credentials

The system comes with pre-configured users:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | admin123 |
| Professor | professor@example.com | prof123 |
| Student | student@example.com | student123 |

**⚠️ SECURITY WARNING**: Change these passwords immediately in production!

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   Database      │
│   (React/Vite)  │    │   (Node.js)     │    │   (PostgreSQL)  │
│   Port: 80      │───▶│   Port: 5000    │───▶│   Port: 5432    │
│   nginx         │    │   Express       │    │   postgres:15   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Docker Services

### Frontend (`gmt-frontend`)
- **Technology**: React with Vite, served by nginx
- **Port**: 80
- **Features**: 
  - Production-optimized build
  - Gzip compression
  - Client-side routing support
  - Security headers

### Backend (`gmt-backend`)
- **Technology**: Node.js with Express
- **Port**: 5000
- **Features**:
  - RESTful API
  - JWT authentication
  - File upload support
  - Database connection pooling

### Database (`gmt-database`)
- **Technology**: PostgreSQL 15 Alpine
- **Port**: 5432
- **Features**:
  - Persistent data storage
  - Automatic schema initialization
  - Health checks
  - Connection ready validation

## Docker Commands

### Basic Operations
```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f database
```

### Development Operations
```bash
# Start in development mode (with hot reload)
docker-compose -f docker-compose.dev.yml up -d

# Rebuild containers after code changes
docker-compose build

# Restart a specific service
docker-compose restart backend
```

### Maintenance Operations
```bash
# View running containers
docker-compose ps

# Execute commands in containers
docker-compose exec backend bash
docker-compose exec database psql -U postgres -d grade_management

# Remove everything (including volumes - DATA WILL BE LOST!)
docker-compose down -v
```

## Environment Variables

### Backend Configuration
| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | production |
| `PORT` | Server port | 5000 |
| `DB_HOST` | Database hostname | database |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | grade_management |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | password |
| `JWT_SECRET` | JWT signing secret | ⚠️ **CHANGE THIS** |
| `EMAIL_USER` | SMTP email | your_email@gmail.com |
| `EMAIL_PASS` | SMTP password | your_app_password |

### Frontend Configuration
The frontend automatically detects the backend URL. For custom configurations, set:
```bash
VITE_API_URL=http://localhost:5000/api
```

## Networking

### Internal Communication
- Services communicate using Docker network `gmt-network`
- Backend connects to database using hostname `database`
- Frontend served through nginx reverse proxy

### External Access
- Frontend: `http://localhost` (port 80)
- Backend: `http://localhost:5000`
- Database: `localhost:5432` (for external tools)

## Data Persistence

### Database Data
- Stored in Docker volume `postgres_data`
- Survives container restarts and recreations
- Remove with `docker-compose down -v` (⚠️ **DATA LOSS**)

### File Uploads
- Stored in `./server/uploads` directory
- Mounted as volume for persistence
- Accessible from host filesystem

## Health Monitoring

All services include health checks:

```bash
# Check service health
docker-compose ps

# View health check logs
docker inspect gmt-backend --format='{{.State.Health.Status}}'
```

### Health Endpoints
- Backend: `http://localhost:5000/health`
- Frontend: `http://localhost` (nginx status)
- Database: PostgreSQL ready check

## Troubleshooting

### Common Issues

#### Port Conflicts
```bash
# Check if ports are in use
netstat -an | findstr :80
netstat -an | findstr :5000
netstat -an | findstr :5432

# Stop conflicting services or change ports in docker-compose.yml
```

#### Database Connection Issues
```bash
# Check database logs
docker-compose logs database

# Test database connection
docker-compose exec database psql -U postgres -d grade_management -c "SELECT NOW();"
```

#### Container Build Issues
```bash
# Clean rebuild
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

#### Permission Issues
```bash
# Fix volume permissions
docker-compose exec backend chown -R nodejs:nodejs /app/uploads
```

### Performance Optimization

#### Production Deployment
1. **Use environment variables for sensitive data**
2. **Enable SSL/TLS in production**
3. **Configure proper backup strategy**
4. **Monitor resource usage**
5. **Set up log rotation**

#### Resource Limits
Add to docker-compose.yml:
```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 512M
          cpus: "0.5"
```

## Security Considerations

### Production Checklist
- [ ] Change default passwords
- [ ] Generate strong JWT secret
- [ ] Configure proper email credentials
- [ ] Enable SSL/TLS
- [ ] Configure firewall rules
- [ ] Set up regular backups
- [ ] Monitor logs for security events

### Backup Strategy
```bash
# Backup database
docker-compose exec database pg_dump -U postgres grade_management > backup.sql

# Restore database
cat backup.sql | docker-compose exec -T database psql -U postgres grade_management
```

## Scaling

### Horizontal Scaling
To run multiple backend instances:
```yaml
services:
  backend:
    scale: 3  # Run 3 backend instances
```

### Load Balancer
For production, consider adding nginx load balancer:
```yaml
services:
  nginx-lb:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx-lb.conf:/etc/nginx/nginx.conf
```

## Support

### Logs Location
- Application logs: `docker-compose logs`
- Database logs: `docker-compose logs database`
- System logs: `/var/log/docker/`

### Monitoring
- Use `docker stats` for resource monitoring
- Consider adding monitoring solutions like Prometheus + Grafana

For additional support, check:
- [Docker Documentation](https://docs.docker.com/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [React Documentation](https://react.dev/)
- [Express.js Documentation](https://expressjs.com/)