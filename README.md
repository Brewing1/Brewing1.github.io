# interpretingrlbehavior.github.io

### Steps for setting up development
1. Clone the repository with *git clone*
2. Run *npm install* inside the repository
3. Run *npm run dev* to start a local web server at http://localhost:8000/

The article text and high level formatting resides in */src/index.ejs*. Custom javascript files should be stored in */src*. Images, videos and custom css should be stored in */static*.

### Build and deploy
1. Run *npm run build*. This will create or update the */docs* directory with the compiled html and accompanying files.

After pushing to the remote, github will read from the */docs* directory automatically and deploy to https://interpretingrlbehavior.github.io/


### Data import
The data import script requires output of the preprocessing scripts in the `/train-procgen-pytorch` repo. It reads this data, and reformats it into json and images. By default it will overwrite the `static/data` folder.

You can run the script from the base of the website repo with
```
$ python import_data --samples [num samples to import] --input_directory [path to the train-procgen-pythorch repo] --output_directory [path to where you want the data exported]
```

### Panel view
When the server is running locally, you can visit `localhost:8000/panel.html` to interact with the data. If there is data in `static/localData` it will use this data by default. If not, it will use the data in `static/data`.
