
# Gator 

A robust CLI-based blog aggregator built with TypeScript, featuring PostgreSQL persistence and comprehensive test coverage.

## Features

- **User Management**: Secure registration and session-based authentication
- **Feed Aggregation**: Fetch and parse RSS/Atom feeds from multiple sources
- **Feed Management**: Follow, unfollow, and organize your favorite blogs
- **Database Persistence**: Reliable PostgreSQL storage with Drizzle ORM
- **CLI Interface**: Intuitive command-line interface for all operations
- **Test Coverage**: Comprehensive unit and integration tests with Vitest

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Testing**: Vitest
- **Package Manager**: npm

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm

### Clone & Install

```bash
git clone https://github.com/username/Blog-Aggregator.git
cd Blog-Aggregator
npm install
```

## Configuration

### 1. Database Setup

Install and configure PostgreSQL:

```bash
# Update package lists
sudo apt update

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Set PostgreSQL user password
sudo passwd postgres

# Start PostgreSQL service
sudo service postgresql start
```

Create the application database:

```bash
# Access PostgreSQL shell
sudo -u postgres psql

# Create database and configure user
CREATE DATABASE gator;
\c gator
ALTER USER postgres PASSWORD 'postgres';
\q
```

### 2. Application Configuration

Create the configuration file in your home directory:

```bash
touch ~/.gatorconfig.json
```

Add the following configuration:

```json
{
    "dbUrl": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable",
    "currentUserName": "your_username"
}
```

### 3. Database Migrations

Generate and run database migrations:

```bash
# Generate schemas
npx drizzle-kit generate

# Run migrations
npx drizzle-kit migrate
```

## Testing

Gator uses **Vitest** for comprehensive testing. Run the test suite with:

```bash
# Run all tests
npm run test
```

## Usage

Start the application:

```bash
npm run start
```

### Available Commands

| Command | Description |
|---------|-------------|
| `login` | Authenticate and start a session |
| `register` | Create a new user account |
| `reset` | Reset the database (⚠️ Destructive) |
| `users` | List all registered users |
| `agg` | Aggregate and fetch all feeds |
| `addfeed` | Add a new RSS/Atom feed |
| `feeds` | List all available feeds |
| `follow` | Follow a specific feed |
| `following` | Display feeds you're following |
| `unfollow` | Unfollow a specific feed |

### Example Workflow

```bash
# Start the application
npm run start

# Register a new account
> register "johndoe"

# Add a feed
npm run start addfeed  "Example Blog" "https://example.com/feed.xml"
 
# Aggregate latest posts
npm run start agg

# Check your followed feeds
npm run start following
```

## Project Structure

```
Blog-Aggregator/
├── src/
│   ├── functions.ts      # CLI command implementations
│   ├── lib/db/           # Database schema and connection
│   ├── middlewares.ts       # Middleware function
│   └── index.ts       # Entry function    
├── config.test.ts          # Vitest test suites
└── config.d.ts           # Configuration types
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
