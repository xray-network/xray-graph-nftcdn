#############################################################################################
### METADATA EXTRACTOR ###
FROM node:20.11 as nftcdn-extractor
WORKDIR /home/node/app
COPY ./nftcdn ./
RUN yarn install
RUN yarn add sharp --ignore-engines
RUN yarn build
CMD [ "node", "build/src/extractor.js" ]

#############################################################################################
### METADATA & IMAGES SERVER ###
FROM nftcdn-extractor as nftcdn-server
WORKDIR /home/node/app
CMD [ "node", "build/src/server.js" ]