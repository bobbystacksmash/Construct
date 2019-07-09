######################################
# This is an experimental Dockerfile #
######################################

FROM node:10

WORKDIR /usr/src/Construct

COPY package.json ./
RUN npm install

COPY construct.cfg .
COPY index.js .
COPY plugins plugins/
COPY reporters reporters/
COPY src src/
COPY tasks tasks/
COPY utils utils/

EXPOSE 8080

CMD ["node", "/usr/src/Construct/src/http/app.js"]
