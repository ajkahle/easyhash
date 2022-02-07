## Easy Hash
*A simple tool for hashing your email lists for list swaps*
- Makes hashing a column on a file easy
- Doesn't save any of your data
- Makes comparing your list to a hashed file easy

### How It Works
#### Hash Single File
*Upload a csv file and download hashed files*

- Parses a csv file and sends JSON to server to hash
- Returns zip file including: full file with added hash field and only hash field (for swapping)

#### Compare Files
*Upload 2 csv files: one with your data and one with a hash file to compare and download the overlap*

- Parses 2 csv files and sends JSON to server
- Hashes first file and compares the designated fields across both
- Returns zip file including: your unique data (for swapping), overlap, and other unique data

### Run Locally
*Don't want to upload your list to the live version? You can download and run locally!*

#### Install Pre-Requisites
- Make sure you have [the latest version of Node.js](https://nodejs.org/en/download/) installed on your machine
- Make sure you have [the latest version of Git](https://git-scm.com/) installed on your machine

#### Downloading the Code
- Open your Command Prompt (Windows) or Terminal (Mac)
- Navigate to the folder you want to put the code (`cd DIRECTORY_NAME` to "click" into a directory)
- Enter `git clone git@github.com:ajkahle/easyhash.git` in your command line. It will download the code to a new folder in the current directory called "easyhash"
- Use `cd easyhash` to move into the new directory with the code
- Enter `npm install` to install the requirements for EasyHash

#### Running EasyHash Locally
- From the same directory, enter `npm start`. There should be a message that says `http server listening on 8080`
- In a web browser, go to [localhost:8080](localhost:8080)
- The EasyHash interface should appear, and you can use the tool without uploading your list online


### Pull requests
*Pull requests are encouraged!*

Have suggestions? Submit an issue or a pull request.
