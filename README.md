# pizza-planet-app
App for configuring MERN stack, and deployment
# Run 'npm install' in client and server directories
# Navigate to server folder
# Docker initialize BASH command
docker run -d \ --name pizza-mongo \ -p 27017:27017 \ -v pizza_mongo_data:/data/db \ mongo:7
# Run 'npm run dev'