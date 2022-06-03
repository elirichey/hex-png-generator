// Test Data...

const hex1 = "#0F00F0";
const hex2 = "#00BB00";
const hex3 = "#DD0000";
const hexWithout = "AA0000";
const shortHex = "303";
const brokenBoundry = "G0FA50";
const brokenLength = "00F0A";

const hexCodes = [
  hex1,
  hex2,
  hex3,
  hexWithout,
  shortHex,
  brokenBoundry,
  brokenLength,
];

// Functionality

const fs = require("fs"); // File System
const path = require("path"); // File Paths
const nodeHtmlToImage = require("node-html-to-image");
const regex = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;

const awaitSuccesses = async () => {
  const successFolder = "./output/success";
  let generatedImages = [];
  await new Promise((resolve) => {
    fs.readdir(successFolder, (err, files) => {
      if (files.length > 0) {
        files.forEach((file) => {
          const isDotFile = file.startsWith(".");
          if (!isDotFile) {
            const ext = path.extname(file);
            const split = file.split(ext);
            const name = split[0];
            resolve(generatedImages.push(name));
          }
        });
      }
      resolve();
    });
  });
  return generatedImages;
};

const awaitFailures = async () => {
  const failedFolder = "./output/failed";
  let generatedFailures = [];
  await new Promise((resolve) => {
    fs.readdir(failedFolder, (err, files) => {
      if (files.length > 0) {
        files.forEach((file) => {
          const isDotFile = file.startsWith(".");
          if (!isDotFile) {
            const ext = path.extname(file);
            const split = file.split(ext);
            const name = split[0];
            resolve(generatedFailures.push(name));
          }
        });
      }
      resolve();
    });
  });
  return generatedFailures;
};

const generateImage = (hex) => {
  nodeHtmlToImage({
    output: `./output/success/${hex}.png`,
    html: `
      <html>
        <head>
          <style>
            body {
              width: 50px;
              height: 50px;
              background-color: #${hex}
            }
          </style>
        </head>
        <body></body>
      </html>
    `,
  }).then(() => console.log("Image created successfully!", hex));
};

const runScript = async () => {
  try {
    const successes = await awaitSuccesses();
    const failures = await awaitFailures();

    console.log("SUCCESSES", successes);
    console.log("FAILURES", failures);

    hexCodes.map((item, i) => {
      const sanitizeHex = item.replace("#", "");
      const isHexCode = regex.test(sanitizeHex);

      if (isHexCode) {
        // Check if it exists...
        const alreadyCreated = successes.some((x) => x === sanitizeHex);
        if (alreadyCreated) return;
        else generateImage(sanitizeHex);
      } else {
        // This will fail on a per product variation basis
        // Date should be item id
        const date = JSON.stringify(new Date().getTime());
        const payload = {
          itemId: date,
          hexCode: `#${sanitizeHex}`,
        };
        const failedData = JSON.stringify(payload, null, 2);
        fs.writeFileSync(
          `./output/failed/${date}__${sanitizeHex}.json`,
          failedData
        );
      }
    });
  } catch (e) {
    console.log("ERROR", e);
  }
};

runScript();
