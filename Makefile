all: build

build:
	pxt build

deploy:
	pxt deploy

test:
	pxt test

lint:
	npm run lint

clean:
	rm -rf built/
