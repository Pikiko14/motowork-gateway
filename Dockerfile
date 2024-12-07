FROM node:20

# Set the working directory
WORKDIR /home/motowork-gateway

# Copy package.json and package-lock.json to the working directory
COPY package*.json ./

# Install dependencies
RUN npm cache clean --force && npm install && npm install ts-node -g

# Copy the rest of the application files
COPY . .

# Expose the port the app runs on
EXPOSE 3080

# Command to run the application
CMD ["npm", "run", "dev"]
