If you want to install the node packages locally, you can:
1. cd to docker folder
2. Enter the docker image. (requires image to be built at least once (e.g. `sudo docker compose up`))

```
./enter.sh astro
```
3. Install packages
```
npm i
```

TO INSTALL NEW PACKAGES:
1. cd to the docker folder
2. Enter local node_modules
```
./enter.sh astro
```
3. Install your desired packages
4. Purge previous docker images
```
./purge.sh
```
5. Rebuild
```
./run.sh dev
```