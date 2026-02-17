const bcrypt = require("bcrypt");

bcrypt.hash("passwordbaru123", 10).then(hash => {
  console.log(hash);
});
