# Variables
APP_NAME = nextjs-app
DOCKER_IMAGE = $(APP_NAME):latest
CONTAINER_NAME = $(APP_NAME)-container
PORT = 3000

# Default target
.PHONY: help
help:
	@echo "Available commands:"
	@echo "  make build       - Build Docker image"
	@echo "  make run         - Run container in development mode"
	@echo "  make prod        - Run container in production mode"
	@echo "  make stop        - Stop running container"
	@echo "  make clean       - Remove container and image"
	@echo "  make logs        - View container logs"
	@echo "  make shell       - Access container shell"
	@echo "  make deploy      - Build and run in production mode"
	@echo "  make restart     - Stop, rebuild, and run in production mode"

# Build the Docker image
.PHONY: build
build:
	docker build -t $(DOCKER_IMAGE) .

# Run container in development mode
.PHONY: run
run:
	docker run --rm -it \
		-p $(PORT):$(PORT) \
		-v $(PWD):/app \
		--name $(CONTAINER_NAME) \
		-e NODE_ENV=development \
		$(DOCKER_IMAGE)

# Run container in production mode
.PHONY: prod
prod:
	@echo "Checking if Docker image exists..."
	@docker image inspect $(DOCKER_IMAGE) >/dev/null 2>&1 || { echo "Error: Docker image $(DOCKER_IMAGE) not found. Run 'make build' first."; exit 1; }
	docker run -d \
		-p $(PORT):$(PORT) \
		--name $(CONTAINER_NAME) \
		-e NODE_ENV=production \
		$(DOCKER_IMAGE)

# Stop running container
.PHONY: stop
stop:
	docker stop $(CONTAINER_NAME) || true

# Remove container and image
.PHONY: clean
clean: stop
	docker rm $(CONTAINER_NAME) || true
	docker rmi $(DOCKER_IMAGE) || true

# View container logs
.PHONY: logs
logs:
	docker logs -f $(CONTAINER_NAME)

# Access container shell
.PHONY: shell
shell:
	docker exec -it $(CONTAINER_NAME) /bin/sh

# Build and run in production mode
.PHONY: deploy
deploy: build
	@echo "Image built successfully. Starting container..."
	$(MAKE) prod

# Restart: stop, build, and run
.PHONY: restart
restart: stop build prod

# For Coolify deployment
.PHONY: coolify-deploy
coolify-deploy: build
	@echo "Docker image built successfully. Ready for Coolify deployment."
	@echo "Make sure your Coolify instance is configured to use this Dockerfile."