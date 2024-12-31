#############################################################################################
### METADATA SERVER ###
FROM node:20.11 as nftcdn-server
WORKDIR /home/node/app
COPY ./nftcdn ./
RUN yarn install
RUN yarn add sharp --ignore-engines
RUN yarn build
CMD [ "node", "build/src/index.js" ]