FROM node:18

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY ./ ./
ENV TZ=Europe/Berlin
RUN apt-get update && apt-get install -y tzdata && ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

CMD [ "npm", "run", "start:dev" ]