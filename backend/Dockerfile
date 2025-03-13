# Usar una imagen base de Node.js
FROM node:16

# Establecer el directorio de trabajo dentro del contenedor
WORKDIR /app

# Copiar el archivo de dependencias
COPY package*.json ./

# Instalar dependencias
RUN npm install

# Copiar el resto del código
COPY . .

# Exponer el puerto en el que correrá la aplicación
EXPOSE 3000

# Comando para iniciar la aplicación
CMD ["node", "src/index.js"]