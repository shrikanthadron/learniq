-- pgAdmin: Query Tool → connect to database "postgres" → paste all → Execute (F5)

-- Step 1: Create or reset user (run both lines; ignore "already exists" if needed)
CREATE ROLE learniq WITH LOGIN PASSWORD 'learniq_secret';
ALTER ROLE learniq WITH LOGIN PASSWORD 'learniq_secret';

-- Step 2: Create database (skip if you already have database "learniq")
CREATE DATABASE learniq OWNER learniq;
