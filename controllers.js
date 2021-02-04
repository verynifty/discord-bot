require("dotenv").config();

exports.soon = async () => {
  const ONE_DAY = 24 * 60 * 60;
  let connectInfos = {
    user: "doadmin",
    host: "verynifty-do-user-2688161-0.b.db.ondigitalocean.com",
    database: "verynifty",
    password: process.env.DB,
    port: 25061,
    ssl: true,
    ssl: { rejectUnauthorized: false },
    max: 3,
  };
  pg = require("pg");
  let pool = new pg.Pool(connectInfos);

  const currentTime = Date.now() / 1000;

  const client = await pool.connect();
  var res = await client.query(
    "select * from vnft v where starvingtime  < now()  +  interval '2 hours' and isdead = false and level != 1"
  );
  client.release;
  msgs = [];
  for (const vnft of res.rows) {
    msgs.push(
      `vNFT #${vnft.id} ${vnft.name ? vnft.name : ""} on level: ${
        vnft.level
      } with score: ${vnft.score} is dying in ${(
        Math.floor(+vnft.timeuntilstarving - currentTime) / 60
      ).toFixed(1)} mins!`
    );
  }
  return msgs;
};

exports.getVnft = async (id) => {
  const ONE_DAY = 24 * 60 * 60;
  let connectInfos = {
    user: "doadmin",
    host: "verynifty-do-user-2688161-0.b.db.ondigitalocean.com",
    database: "verynifty",
    password: process.env.DB,
    port: 25061,
    ssl: true,
    ssl: { rejectUnauthorized: false },
    max: 3,
  };
  pg = require("pg");
  let pool = new pg.Pool(connectInfos);

  const currentTime = Date.now() / 1000;

  const client = await pool.connect();
  var res = await client.query("select * from vnft v where id=" + parseInt(id));
  client.release;
  if (res.rows) {
    return res.rows[0];
  }
};
