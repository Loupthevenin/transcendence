DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_FILE = ./docker-compose.yml
DOCKER = $(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE)

all: up

build:
	@$(DOCKER) build

up: build
	@$(DOCKER) up

start:
	@$(DOCKER) up -d

stop:
	@$(DOCKER) stop

down:
	@$(DOCKER) down

restart:
	@$(DOCKER) stop
	@$(DOCKER) up

logs:
	@$(DOCKER) logs

ps status:
	@ docker ps

clean:
	(docker stop $$(docker ps -qa); \
	docker rm $$(docker ps -qa); \
	docker rmi -f $$(docker images -qa); \
	docker volume rm $$(docker volume ls -q); \
	docker network rm $$(docker network ls -q)) 2>/dev/null || true

re: clean all

.PHONY: all up start stop restart logs down status ps clean re

#delete all cache : docker system prune -a
