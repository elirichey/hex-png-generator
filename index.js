const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const csv = require("@fast-csv/parse");
const regex = /^#?([0-9a-f]{6}|[0-9a-f]{3})$/i;

// Parsed CSV Values
let hexCodes = [];

const parseHexCodesFromCSV = async () => {
  const contactFileSrc = `./color_options.csv`;
  const reponse = await new Promise((resolve) => {
    return fs
      .createReadStream(path.resolve(contactFileSrc))
      .pipe(
        csv.parse({
          headers: (headers) =>
            headers.map((header) => {
              header = header.replace(/[^A-Za-z0-9]/g, "");
              return header;
            }),
        })
      )
      .on("error", (error) => console.error(error))
      .on("data", (row) => hexCodes.push(row))
      .on("end", (rowCount) => {
        console.log(`Parsed ${rowCount} rows`);
        return resolve(hexCodes);
      });
  });

  return reponse;
};

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

const generateImage = async (hex) => {
  return await sharp({
    create: {
      width: 50,
      height: 50,
      channels: 4,
      background: `#${hex}`,
    },
  })
    .png()
    .toFile(`output/success/${hex}.png`)
    .then((data) => console.log("Image created successfully!", hex))
    .catch((err) => console.log("Error", err));
};

const runScript = async () => {
  try {
    const parsed = await parseHexCodesFromCSV();
    // console.log("Done", parsed);

    const successes = await awaitSuccesses();
    const failures = await awaitFailures();
    // console.log("SUCCESSES", successes);
    // console.log("FAILURES", failures);

    hexCodes.map(async (item, i) => {
      const sanitizeHex = item.Hexc.replace("#", "").toUpperCase();
      const isHexCode = regex.test(sanitizeHex);

      if (isHexCode) {
        // Check if it exists...
        const alreadyCreated = successes.some((x) => x === sanitizeHex);
        if (alreadyCreated) return;
        else await generateImage(sanitizeHex);
      } else {
        // This will fail on a per product variation basis
        const payload = {
          itemId: item.Id,
          hexCode: `#${sanitizeHex}`,
        };
        const failedData = JSON.stringify(payload, null, 2);
        fs.writeFileSync(
          `./output/failed/${item.Id}__${sanitizeHex}.json`,
          failedData
        );
      }
    });
  } catch (e) {
    console.log("ERROR", e);
  }
};

runScript();
