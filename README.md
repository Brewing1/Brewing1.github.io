# brewing1.github.io

### Steps for setting up development
1. Clone the repository with *git clone*
2. Run *npm install* inside the repository
3. Run *npm run dev* to start a local web server at http://localhost:8000/

The article text and high level formatting resides in */src/index.ejs*. Custom javascript files should be stored in */src*. Images, videos and custom css should be stored in */static*.

### Build and deploy
1. Run *npm run build*. This will create or update the */docs* directory with the compiled html and accompanying files.

After pushing to the remote, github will read from the */docs* directory automatically and deploy to https://brewing1.github.io/