DOCKER_COMPOSE = docker compose
DOCKER_COMPOSE_FILE = ./docker-compose.yml
DOCKER = $(DOCKER_COMPOSE) -f $(DOCKER_COMPOSE_FILE)

all: compile-blockchain up

compile-blockchain:
	@cd blockchain && npx hardhat compile

build:
	@mkdir -p ./db
	@$(DOCKER) build

up: build
	@$(DOCKER) up

down:
	@$(DOCKER) down

start:
	@mkdir -p ./db
	@$(DOCKER) up -d

stop:
	@$(DOCKER) stop

restart: stop start

logs:
	@$(DOCKER) logs

ps status:
	@ docker ps

clean:
	(docker stop $$(docker ps -qa -f "label=project=transcendence"); \
	docker rm $$(docker ps -qa -f "label=project=transcendence"); \
	docker rmi -f $$(docker images -f "label=project=transcendence" -qa); \
	docker volume rm $$(docker volume ls -q); \
	docker network rm $$(docker network ls -q)) 2>/dev/null || true
	@rm -rf ./blockchain/artifacts/ ./blockchain/cache ./blockchain/typechain-types/ 2>/dev/null || true

fclean: clean
	@if [ "$(shell id -u)" != "0" ]; then \
		echo "Please run with sudo to use rm"; \
		exit 1; \
	fi

	rm -rf backend/app/node_modules frontend/node_modules blockchain/node_modules 2>/dev/null || true
	rm -rf backend/app/package-lock.json frontend/package-lock.json blockchain/package-lock.json 2>/dev/null || true

	(rm -rf ./backend/app/dist; \
	rm -rf ./frontend/public/*.js ./frontend/public/**/*.js ./frontend/public/output.css; \
	find ./frontend/public -type d -empty -delete) || true

re: fclean all

.PHONY: all compile-blockchain build up down start stop restart logs ps status clean fclean re

# delete all cache : docker system prune -a

# usefull regex :
#  - typeless variable
#      const\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*[^;]+|let\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*[^;]+|var\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*=\s*[^;]+
#  - typeless arrow function argument
#      \(\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\)\s*=>\s*\{
#  - typeless function return
#      function\s+([a-zA-Z_$][0-9a-zA-Z_$]*)\s*\([^)]*\)\s*(?!:)\s*\{
