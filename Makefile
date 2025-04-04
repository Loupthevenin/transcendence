DOCKER_COMPOSE = docker-compose
DOCKER_COMPOSE_FILE = ./docker-compose.yml

build:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) build

up: build
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up

start:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up -d

stop:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) stop

restart:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) stop
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) up

logs:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) logs

status:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) ps

ps: status

clean:
	@$(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE) down

.PHONY: up start stop restart logs status ps clean
