# Usamos una imagen ligera de Node
FROM node:18-alpine

# Creamos el directorio de trabajo
WORKDIR /usr/src/app

# Copiamos los archivos de dependencias primero
COPY package*.json ./

# Instalamos las dependencias
# Usamos 'npm ci' si tienes un package-lock.json para instalaciones más rápidas y exactas
RUN npm install

# Copiamos el resto del código
COPY . .

# El puerto se define por la variable de entorno, 
# pero dejamos EXPOSE como referencia documental.
EXPOSE 3001
EXPOSE 3002

# Comando para arrancar la app
# Es mejor usar el script de tu package.json para manejar mejor los imports de ES Modules
CMD ["npm", "start"]