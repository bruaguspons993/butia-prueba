all: build

sim:
	cd botsim && npm run build

build: sim
	pxt build

deploy:
	pxt deploy

test:
	pxt test

lint:
	npm run lint

clean:
	rm -rf built/
