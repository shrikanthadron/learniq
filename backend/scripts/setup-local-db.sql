-- Run as superuser (postgres). Safe to ignore "already exists" errors on re-run.

CREATE ROLE learniq WITH LOGIN PASSWORD 'learniq_secret';

CREATE DATABASE learniq OWNER learniq;
