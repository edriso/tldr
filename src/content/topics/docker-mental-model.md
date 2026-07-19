---
title: Docker Mental Model
tldr: Ship the whole environment as a frozen image, then run identical copies of it anywhere.
category: general
tech: devops
order: 84
level: 2
tags: [docker, containers, devops, environments]
quiz:
  - q: "A new developer joins and spends two days installing PHP, MySQL, and Redis at the exact right versions. What Docker feature reduces that to one command?"
    a: "Docker Compose. One compose file declares all services with pinned images, and `docker compose up` starts the whole stack identically on any machine."
  - q: "You fixed a bug inside a running container with a quick edit, restarted the container, and the fix is gone. Why?"
    a: "Containers are disposable instances of an immutable image. Changes made inside a container do not change the image. Fix the Dockerfile (or source code), rebuild the image, and run a new container."
  - q: "Your Postgres container was recreated during a deploy and all data vanished. What was missing?"
    a: "A volume. The container's writable layer dies with the container, so the database directory must be mounted as a volume to survive recreation."
related: [database-migrations, git-workflows, caching-layers-redis]
links:
  - title: Docker get started
    url: https://docs.docker.com/get-started/
    note: Official intro covering images, containers, and registries.
  - title: Docker Compose
    url: https://docs.docker.com/compose/
    note: Official docs for multi-service setups.
---

## Analogy

A Dockerfile is a recipe. An image is the finished frozen meal, sealed and
labeled. A container is one meal heated up and being eaten. A registry is the
freezer aisle where sealed meals wait. You never edit a frozen meal; you
change the recipe and freeze a new batch.

## The five nouns

- **Dockerfile.** The recipe: base system, dependencies, your code, the start command.
- **Image.** The frozen result of the recipe, built as read-only layers. Same image, same behavior, everywhere.
- **Container.** One running instance of an image, with a thin writable layer that dies with it.
- **Registry.** Where images are pushed and pulled from (Docker Hub, or a private one).
- **Volume.** Storage managed outside the container, for data that must outlive it.

## Why layers matter

Each Dockerfile instruction creates a layer, and unchanged layers are
cached. Put rarely changing things (base image, dependencies) before your
code, and rebuilds take seconds instead of minutes.

## Worked example

Containerize a small Node API and its database.

**Step 1: write the recipe.** Dependencies are copied before source code so
the install layer stays cached across code changes.

```dockerfile
FROM node:lts-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
CMD ["node", "server.js"]
```

**Step 2: build the image and tag it.** The tag is a human-friendly label pointing at the frozen result.

```bash
docker build -t shop-api:latest .
```

**Step 3: run a container from the image.** The container is disposable; the image is not touched.

```bash
docker run -p 3000:3000 shop-api:latest
```

**Step 4: give the database a volume so data survives.** Without it, every recreated container starts empty.

```bash
docker run -v shop-data:/var/lib/postgresql/data postgres
```

**Step 5: describe the whole stack in one compose file.** New machine, one command, identical environment.

```yaml
services:
  api:
    build: .
    ports: ["3000:3000"]
  db:
    image: postgres
    volumes: ["shop-data:/var/lib/postgresql/data"]
volumes: { shop-data: }
```

## Try it

Run `docker compose up` with the file from step 5, then `docker compose down`
and `up` again. (Everything comes back, and inserted rows survive thanks to the volume.)

## Real use case

An e-commerce store's checkout works locally but crashes in production,
which runs an older system library. The team ships the app as an image
instead: the exact layers that passed tests are the layers that run in
production. "Works on my machine" stops being an argument.

## Gotchas

- Changes inside a running container are lost when it is removed. Persist data in volumes, persist code changes in the Dockerfile.
- `latest` is just a tag, not a guarantee of the newest version. Pull the tag explicitly or pin a specific one for reproducible deploys.
- Containers are isolated by default. Two compose services talk over the compose network using service names (like `db`), not `localhost`.
- Big images slow every deploy. Use slim base images and a `.dockerignore` file so `node_modules` and `.git` are not copied in. A container is also not a virtual machine: it shares the host kernel and should usually run one process.

## Remember

> Recipe (Dockerfile), frozen meal (image), meal on a plate (container). Never edit the plate; change the recipe and rebuild.
