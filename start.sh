#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║                                                               ║"
echo "║     🚀 AI SPORTS ANALYTICS PLATFORM                          ║"
echo "║                                                               ║"
echo "║     Betting Analyzer | Fantasy Optimizer | Game Strategy     ║"
echo "║     Esports Tracker  | Referee Assistant                     ║"
echo "║                                                               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Change to script directory
cd "$(dirname "$0")"

# Function to cleanup ports
cleanup_ports() {
    echo -e "${YELLOW}🧹 Cleaning up used ports...${NC}"

    # Kill processes on port 3000 (React)
    if lsof -i :3000 > /dev/null 2>&1; then
        echo -e "${CYAN}   Freeing port 3000...${NC}"
        kill -9 $(lsof -t -i :3000) 2>/dev/null || true
    fi

    # Kill processes on port 3001 (Express API)
    if lsof -i :3001 > /dev/null 2>&1; then
        echo -e "${CYAN}   Freeing port 3001...${NC}"
        kill -9 $(lsof -t -i :3001) 2>/dev/null || true
    fi

    # Skip port 5000 as requested
    echo -e "${GREEN}   ✓ Ports cleaned (3000, 3001)${NC}"
}

# Function to check PostgreSQL
check_postgres() {
    echo -e "${YELLOW}🔍 Checking PostgreSQL...${NC}"

    if command -v psql &> /dev/null; then
        # Check if PostgreSQL is running
        if pg_isready -q 2>/dev/null; then
            echo -e "${GREEN}   ✓ PostgreSQL is running${NC}"
            return 0
        else
            echo -e "${CYAN}   Starting PostgreSQL...${NC}"
            # Try to start PostgreSQL (macOS with Homebrew)
            if command -v brew &> /dev/null; then
                brew services start postgresql@14 2>/dev/null || brew services start postgresql 2>/dev/null || true
            fi
            # Try Linux service
            sudo service postgresql start 2>/dev/null || true
            sleep 2
            if pg_isready -q 2>/dev/null; then
                echo -e "${GREEN}   ✓ PostgreSQL started${NC}"
                return 0
            fi
        fi
    fi

    echo -e "${RED}   ⚠ PostgreSQL not found or not running${NC}"
    echo -e "${YELLOW}   Please install and start PostgreSQL:${NC}"
    echo -e "${CYAN}   macOS: brew install postgresql@14 && brew services start postgresql@14${NC}"
    echo -e "${CYAN}   Ubuntu: sudo apt install postgresql && sudo service postgresql start${NC}"
    return 1
}

# Function to setup database
setup_database() {
    echo -e "${YELLOW}📦 Setting up database...${NC}"

    # Load environment variables
    if [ -f .env ]; then
        export $(cat .env | grep -v '^#' | xargs)
    fi

    DB_NAME=${POSTGRES_DB:-ai_sports_analytics}
    DB_USER=${POSTGRES_USER:-postgres}

    # Create database if it doesn't exist
    echo -e "${CYAN}   Creating database '$DB_NAME' if not exists...${NC}"
    psql -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" 2>/dev/null | grep -q 1 || \
        createdb -U $DB_USER $DB_NAME 2>/dev/null || \
        psql -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || true

    echo -e "${GREEN}   ✓ Database ready${NC}"
}

# Function to install dependencies
install_dependencies() {
    echo -e "${YELLOW}📥 Installing dependencies...${NC}"

    # Install root dependencies
    if [ ! -d "node_modules" ]; then
        echo -e "${CYAN}   Installing server dependencies...${NC}"
        npm install
    else
        echo -e "${GREEN}   ✓ Server dependencies already installed${NC}"
    fi

    # Install client dependencies
    if [ ! -d "client/node_modules" ]; then
        echo -e "${CYAN}   Installing client dependencies...${NC}"
        cd client && npm install && cd ..
    else
        echo -e "${GREEN}   ✓ Client dependencies already installed${NC}"
    fi
}

# Function to seed database
seed_database() {
    echo -e "${YELLOW}🌱 Seeding database with sample data...${NC}"

    # Run database setup
    echo -e "${CYAN}   Creating tables...${NC}"
    node server/db/setup.js 2>/dev/null || true

    # Run seed script
    echo -e "${CYAN}   Inserting seed data (15+ items per feature)...${NC}"
    node server/seed.js

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}   ✓ Database seeded successfully${NC}"
    else
        echo -e "${RED}   ⚠ Seeding had some issues, but continuing...${NC}"
    fi
}

# Function to start the application
start_app() {
    echo -e "${YELLOW}🚀 Starting application with hot-reload...${NC}"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}   Application URLs:${NC}"
    echo -e "${CYAN}   Frontend:  http://localhost:3000${NC}"
    echo -e "${CYAN}   API:       http://localhost:3001${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}   Demo Login Credentials:${NC}"
    echo -e "${CYAN}   Email:    demo@sportsanalytics.com${NC}"
    echo -e "${CYAN}   Password: demo123456${NC}"
    echo -e "${YELLOW}   (Click 'Fill Demo Credentials' button on login page)${NC}"
    echo ""
    echo -e "${PURPLE}   Hot-reload enabled: Code changes will automatically refresh${NC}"
    echo -e "${YELLOW}   Press Ctrl+C to stop the server${NC}"
    echo ""

    # Start both server and client with hot-reload
    npm start
}

# Main execution
main() {
    # Check if .env file exists
    if [ ! -f .env ]; then
        echo -e "${RED}⚠ .env file not found!${NC}"
        echo -e "${YELLOW}Creating .env from template...${NC}"
        cat > .env << 'EOF'
# Database Configuration
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/ai_sports_analytics
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
POSTGRES_DB=ai_sports_analytics

# Server Configuration
PORT=3001
NODE_ENV=development

# OpenRouter AI Configuration
OPENROUTER_API_KEY=your_openrouter_api_key_here
OPENROUTER_MODEL=anthropic/claude-haiku-4.5

# JWT Secret for Authentication
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production

# Demo Credentials (for auto-fill login)
DEMO_EMAIL=demo@sportsanalytics.com
DEMO_PASSWORD=demo123456
EOF
        echo -e "${YELLOW}⚠ Please edit .env and add your OPENROUTER_API_KEY${NC}"
    fi

    # Execute startup steps
    cleanup_ports

    if check_postgres; then
        setup_database
        install_dependencies
        seed_database
        start_app
    else
        echo ""
        echo -e "${RED}Cannot start without PostgreSQL. Please install and configure it first.${NC}"
        exit 1
    fi
}

# Handle Ctrl+C gracefully
trap 'echo -e "\n${YELLOW}Shutting down...${NC}"; cleanup_ports; exit 0' INT

# Run main
main
