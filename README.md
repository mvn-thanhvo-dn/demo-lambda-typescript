## Description

A demo AWS lambda with Typescript

## Install node_module (node v16x)

```bash
npm i
```

## Create environment file and add environment variables

Run command

```bash
cp example.env .env
```

After, insert environment variables to .env and Global environment variables in file template.yml

## Build and run with AWS SAM local

1. Build source

```bash
npm run build-api
```

2. Run container postgresql (optional, if you use database in docker)

```bash
docker-compose up db
```

3. Start sam local

```bash
npm run start:dev
```

## Quick start with express for debug

```bash
npm run debug
```

## Step by step run debug with express

1. Build source

```bash
npm run build-api
```

2. Start debug

```bash
node dist/debug/index.js
```
