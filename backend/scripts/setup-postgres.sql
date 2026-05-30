-- Run this in pgAdmin (Query Tool) or: psql -U postgres -f setup-postgres.sql
-- Creates the LearnIQ database user and database (matches backend/.env)

CREATE USER learniq WITH PASSWORD 'learniq_secret';

CREATE DATABASE learniq OWNER learniq;

GRANT ALL PRIVILEGES ON DATABASE learniq TO learniq;

-- PostgreSQL 15+: allow schema access
\c learniq

GRANT ALL ON SCHEMA public TO learniq;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO learniq;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO learniq;
