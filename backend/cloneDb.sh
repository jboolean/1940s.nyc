#!/bin/bash
PGPASSWORD=$(aws ssm get-parameter --name fourtiesnyc-production-db-password --query Parameter.Value --output text --with-decryption) \
pg_dump \
--clean --if-exists \
  --host $(aws ssm get-parameter --name fourtiesnyc-production-db-host --query Parameter.Value --output text --with-decryption) \
  --port $(aws ssm get-parameter --name fourtiesnyc-production-db-port --query Parameter.Value --output text --with-decryption) \
  --username $(aws ssm get-parameter --name fourtiesnyc-production-db-username --query Parameter.Value --output text --with-decryption) \
  --dbname $(aws ssm get-parameter --name fourtiesnyc-production-db-database --query Parameter.Value --output text --with-decryption) \
  | \
PGPASSWORD=$(aws ssm get-parameter --name fourtiesnyc-staging-db-password --query Parameter.Value --output text --with-decryption) \
psql --host $(aws ssm get-parameter --name fourtiesnyc-staging-db-host --query Parameter.Value --output text --with-decryption) \
  --port $(aws ssm get-parameter --name fourtiesnyc-staging-db-port --query Parameter.Value --output text --with-decryption) \
  --username $(aws ssm get-parameter --name fourtiesnyc-staging-db-username --query Parameter.Value --output text --with-decryption) \
  --dbname $(aws ssm get-parameter --name fourtiesnyc-staging-db-database --query Parameter.Value --output text --with-decryption)