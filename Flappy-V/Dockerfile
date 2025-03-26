FROM node:18

WORKDIR /app

# Copiar solo los archivos necesarios para instalar dependencias
COPY package.json package-lock.json ./
RUN npm install

# Copiar el resto de los archivos
COPY . .

# Variables de entorno para Vite
ENV NODE_OPTIONS=--openssl-legacy-provider
ENV HOST=0.0.0.0
ENV PORT=3001

EXPOSE 3001

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3001"]