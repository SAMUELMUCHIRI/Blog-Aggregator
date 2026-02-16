# Gator : Blog Aggregator

## Usage
### Basic Installation
```bash

git clone https://github.com/username/Blog-Aggregator.git
cd Blog-Aggregator

# Install dependencies
pnpm install
```

### Setup Configuration
```bash
# setup config
cd ~
touch .gatorconfig.json

#config database 
#postgress is the database being used 
sudo apt update
sudo apt install postgresql postgresql-contrib
#setup password for postgres user
sudo passwd postgres
#start postgress
sudo service postgresql start


#postgress Shell
sudo -u postgres psql
CREATE DATABASE gator;
\c gator
ALTER USER postgres PASSWORD 'postgres';
#now database is ok 


# update config structure
{
    "dbUrl": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable",
    "currentUserName": "kahya"
}
```
### Database Setup
```bash
#update  drizzle.config.ts in root of project
# Generate Schemas
npx drizzle-kit generate
#Generate Migrations
npx drizzle-kit migrate
```

### Start the server
```bash
# Start the server
npm run start


# Output
------- Blog-Aggregator -------

	Available Commands
- login 	   :Gets you into a session
- register   :Registers a new user
- reset 	   :Resets the database
- users 	   :Lists all users
- agg 		   :Aggregates all feeds
- addfeed	   :Adds a new feed
- feeds 	   :Lists all feeds
- follow 	   :Follows a feed
- following  :Lists all followed feeds
- unfollow   :Unfollows a feed

```

have fun!  :) forking gator
