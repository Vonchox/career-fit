require("dotenv").config({
  path: require("node:path").join(__dirname, "../.env"),
  quiet: true,
});
const database = require("../src/db");
const { seedInstitutions } = require("../src/catalog");
seedInstitutions(database)
  .then(() =>
    console.log("UCE, EPN and ESPE guides ready. Existing data preserved."),
  )
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => database.$disconnect());
