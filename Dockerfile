FROM node AS development

WORKDIR /app

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

COPY package.json  ./
COPY package-lock.json  ./

RUN npm i

COPY . .

ENTRYPOINT ["/entrypoint.sh"]

EXPOSE 3005

CMD ["npm", "run", "start"]
