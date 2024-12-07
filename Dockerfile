FROM node:20

# Establecer directorio de trabajo
WORKDIR /home/motowork-gateway

# Copiar y instalar solo las dependencias
COPY package*.json ./
RUN npm cache clean --force && npm install

# Instalar nodemon y ts-node como globales para hot-reload
RUN npm cache clean --force && npm install && npm install ts-node -g npm install nodemon -g

# Exponer el puerto
EXPOSE 3080

# Comando para iniciar la aplicación con hot-reload
CMD ["nodemon", "src/app.ts"]
