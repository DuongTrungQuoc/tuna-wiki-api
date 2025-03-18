const express = require("express");
const cors = require("cors");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const dotenv = require("dotenv");

// a web-scraped API
const url = "https://en.wikipedia.org/wiki/Tuna";
const tunaUrl = "https://en.wikipedia.org/wiki/";

//SET UP
const app = express();
app.use(bodyParser.json({ limit: "50mb" }));
app.use(cors());
dotenv.config();
app.use(
  bodyParser.urlencoded({
    limit: "50mb",
    extended: true,
    parameterLimit: 50000,
  })
);

//ROUTES
/// GET ALL
app.get("/v1", (req, resp) => {
  const thumbnails = [];
  //console.log(req.query.limit);
  const limit = Number(req.query.limit); // đảm bao limit là số

  try {
    axios(url) // Gửi request để lấy dữ liệu từ URL
      .then((res) => {
        const html = res.data; // Lấy dữ liệu HTML từ response
        const $ = cheerio.load(html); // Dùng Cheerio để phân tích HTML

        // Duyệt qua các thẻ tr trong bảng có class 'wikitable'
        $(".wikitable")
          .first()
          .find("tbody tr")
          .each(function () {
            const name = $(this).children("td").eq(1).find("a").attr("title");
            const url = $(this).children("td").eq(1).find("a").attr("href");
            const image = $(this)
              .children("td")
              .eq(0)
              .find("span > a > img")
              .attr("src");
            const status = $(this).children("td").eq(9).find("small").text();
            const status_icon = $(this)
              .children("td")
              .eq(9)
              .find("span > a > img")
              .attr("src");
            const max_length = $(this)
              .children("td")
              .eq(3)
              .text()
              .split("\n")[0];
            const common_length = $(this)
              .children("td")
              .eq(4)
              .text()
              .split("\n")[0];
            const max_weight = $(this)
              .children("td")
              .eq(5)
              .text()
              .split("\n")[0];
            const max_age = $(this).children("td").eq(6).text().split("\n")[0];
            //console.log(`Name: ${name} - URL: ${url} - Image: ${image}`);
            if (name) {
              // /wiki/Albacore
              //  split ["/wiki", "/Albacore"]
              thumbnails.push({
                name: name,
                url: "http://localhost:8000/v1" + url.split("/wiki")[1],
                image: `https:${image}`,
                status: status,
                status_icon: `https:${status_icon}`,
                max_length: max_length,
                common_length: common_length,
                max_weight: max_weight,
                max_age: max_age || "7-10 yrs",
              });
            }
          });
        if (limit && limit > 0 && limit < thumbnails.length) {
          resp.status(200).json(thumbnails.slice(0, limit));
        } else {
          resp.status(200).json(thumbnails);
        }
      });
  } catch (err) {
    resp.status(500).json(err);
  }
});
/// GET A TUNA DETAIL
app.get("/v1/:tuna", (req, resp) => {
  //console.log(req.params.tuna);
  let url = tunaUrl + req.params.tuna;

  //const tuna = [];
  const tunaObj = {};
  try {
    axios(url) // Gửi request để lấy dữ liệu từ URL
      .then((res) => {
        //console.log(res.data);
        const html = res.data; // Lấy dữ liệu HTML từ response
        const $ = cheerio.load(html); // Dùng Cheerio để phân tích HTML
        $(".infobox > tbody > tr").each(function () {
          // get image
          const image = $(this)
            .find("td > span > .mw-file-description > img")
            .attr("src");
          // get name
          // const name = $(this).find("th").text().split("\n")[0];
          // get tuna attributes
          const key = $(this)
            .children("td")
            .eq(0)
            .text()
            .split("\n")[0]
            .split(":")[0]
            .toLocaleLowerCase();

          //get tuna values
          const value = $(this).children("td").eq(1).text().split("\n")[0];

          //console.log(image);
          if (key && value) {
            console.log(`Key: ${key} - Value: ${value}`);

            // create tuna object with key and value
            tunaObj[key] = value;
            tunaObj["name"] = req.params.tuna.replace("_", " ");
          }
          if (image) {
            tunaObj["image"] = `https:${image}`;
          }
          // if (name) {
          //   if (tunaObj["name"] === undefined) {
          //     tunaObj["name"] = name;
          //   }
          // }
        });
        resp.status(200).json(tunaObj);
      });
  } catch (err) {
    resp.status(500).json(err);
  }
});

// RUN PORT
app.listen(process.env.PORT || 8000, () => {
  console.log("Server is running...");
});
