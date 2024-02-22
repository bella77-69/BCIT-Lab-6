/*
 * Project: Milestone 1
 * File Name: IOhandler.js
 * Description: Collection of functions for files input/output related operations
 *
 * Created Date:
 * Author:
 *
 */
const yauzl = require("yauzl-promise"),
  fs = require("fs"),
  fsPromise = require("fs").promises,
  { pipeline } = require("stream/promises");
(PNG = require("pngjs").PNG), (path = require("path"));

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */
const unzip = async (pathIn, pathOut) => {
  //make sure the pathOut directory exists, if not create it
  await fs.promises.mkdir(pathOut, { recursive: true });
  //open the zip file
  const zip = await yauzl.open(pathIn);
  try {
    //iterate through each entry in the zip file
    for await (const entry of zip) {
      //if the entry is a directory, create the directory in the pathOut
      if (entry.filename.endsWith("/")) {
        //make sure the directory exists, if not create it
        await fs.promises.mkdir(path.join(pathOut, entry.filename), {
          recursive: true,
        });
      } else {
        //if the entry is a file, open the read stream
        const readStream = await entry.openReadStream();
        //create the write stream
        const writeStream = fs.createWriteStream(
          path.join(pathOut, entry.filename)
        );
        //pipe the read stream to the write stream
        await pipeline(readStream, writeStream);
      }
    }
  } finally {
    //close the zip file
    await zip.close();
  }
};

//paths
const pathIn = "myfile.zip";
const pathOut = "unzipped";

//call the function
unzip(pathIn, pathOut)
  .then(() => console.log("Extraction operation complete"))
  .catch((error) => console.error("Error during unzip:", error));

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */

const readDir = async (dir) => {
  try {
    //read the directory
    const files = await fs.promises.readdir(dir);

    //filter out the _MACOSX folder
    const ignoreFiles = files.filter((file) => file !== "__MACOSX");

    //filter out the png files
    const pngFiles = ignoreFiles.filter(
      (file) => path.extname(file) === ".png"
    );

    //return the array of file paths & map through, join the directory path with the file name
    const filePaths = pngFiles.map((file) => path.join(dir, file));
    //return the array of file paths
    return filePaths;
  } catch (error) {
    //error handling
    console.error("Error reading directory:", error);
  }
};

const dir = "unzipped";
readDir(dir)
  .then((filePaths) => {
    console.log("PNG Files in the directory:", filePaths);
  })
  .catch((error) => {
    console.error("Error reading directory:", error);
  });

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */

const grayScale = (inputPath, outputPath) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Read the png image
      const inputImage = await fsPromise.readFile(inputPath);

      // Parse the png image
      const png = PNG.sync.read(inputImage);

      // Loop through the pixel array and apply grayscale filter
      for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
          const idx = (png.width * y + x) << 2;

          // Extract color values
          const red = png.data[idx];
          const green = png.data[idx + 1];
          const blue = png.data[idx + 2];

          // Calculate greyscale value
          const grey = 0.21 * red + 0.72 * green + 0.07 * blue;

          // Set red, green, blue to the grey value
          png.data[idx] = grey;
          png.data[idx + 1] = grey;
          png.data[idx + 2] = grey;
        }
      }
      // Write the new grayscale image to the output path (unzipped folder)
      await fsPromise.writeFile(outputPath, PNG.sync.write(png));

      console.log("Grayscaled successfully");
      // Resolve the promise
      resolve();
    } catch (error) {
      // error handling
      console.error("Error processing image:", error);
      reject(error);
    }
  });
};

const grayScaleAll = async (inputFolder, outputFolder) => {
  try {
    // Read all the png files from the input folder
    const files = await fsPromise.readdir(inputFolder);

    //filter out the _MACOSX folder
    const ignoreFiles = files.filter((file) => file !== "__MACOSX");

    //create grayscaled folder
    await fsPromise.mkdir(outputFolder, { recursive: true });

    // Map through the files and apply the grayscale filter to each image
    const promises = ignoreFiles.map(async (file) => {
      const inputPath = path.join(inputFolder, file);
      const outputPath = path.join(outputFolder, file);

      // call the grayscale function to apply the greyscale filter
      return grayScale(inputPath, outputPath);
    });
    // Wait for all the promises to resolve
    await Promise.all(promises);
    // Log when all the images are grayscaled
    console.log("Done, all the png images are grayscaled!");
  } catch (error) {
    // Error handling
    console.error("Error processing images:", error);
  }
};

const inputFolder = "unzipped";
const outputFolder = "grayscaled";

grayScaleAll(inputFolder, outputFolder);

/* 
sepia filter
*/
const sepiaScale = (inputPath, outputPath) => {
  return new Promise(async (resolve, reject) => {
    try {
      // Read the png image
      const inputImage = await fsPromise.readFile(inputPath);

      // Parse the png image
      const png = PNG.sync.read(inputImage);

      // Loop through the pixel array and apply sepia filter
      for (let y = 0; y < png.height; y++) {
        for (let x = 0; x < png.width; x++) {
          const idx = (png.width * y + x) << 2;

          // Calculate sepia values
          const red = png.data[idx];
          const green = png.data[idx + 1];
          const blue = png.data[idx + 2];

          //sepia algorithm
          let newRed = 0.393 * red + 0.769 * green + 0.189 * blue;
          let newGreen = 0.349 * red + 0.686 * green + 0.168 * blue;
          let newBlue = 0.272 * red + 0.534 * green + 0.131 * blue;

          // Ensure values are in the valid range [0, 255]
          newRed = newRed > 255 ? 255 : newRed;
          newGreen = newGreen > 255 ? 255 : newGreen;
          newBlue = newBlue > 255 ? 255 : newBlue;

          png.data[idx] = newRed;
          png.data[idx + 1] = newGreen;
          png.data[idx + 2] = newBlue;
        }
      }

      // Write the new sepia image to the output path (sepia folder)
      await fsPromise.writeFile(outputPath, PNG.sync.write(png));

      console.log("Sepia successfully");

      // Resolve the promise
      resolve();
    } catch (error) {
      // error handling
      console.error("Error processing image:", error);
      reject(error);
    }
  });
};

const sepiaAll = async (inputFolders, outputFolders) => {
  try {
    // Read all the png files from the input folder
    const files = await fsPromise.readdir(inputFolders);

    //filter out the _MACOSX folder
    const ignoreFiles = files.filter((file) => file !== "__MACOSX");
    //create sepia folder
    await fsPromise.mkdir(outputFolders, { recursive: true });

    // Map through the files and apply the sepia filter to each image
    const promises = ignoreFiles.map(async (file) => {
      const inputPath = path.join(inputFolders, file);
      const outputPath = path.join(outputFolders, file);

      // call the sepiaScale function to apply the sepia filter
      return sepiaScale(inputPath, outputPath);
    });
    // Wait for all the promises to resolve
    await Promise.all(promises);
    // Log when all the images are sepia
    console.log("Done, all the png images are sepia!");
  } catch (error) {
    // Error handling
    console.error("Error processing images:", error);
  }
};

const inputFolders = "unzipped";
const outputFolders = "sepia";

sepiaAll(inputFolders, outputFolders);

module.exports = {
  unzip,
  readDir,
  grayScale,
  sepiaAll,
};
