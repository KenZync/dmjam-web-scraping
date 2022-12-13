const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3000;

//Download Ranking into HTML File
app.get("/ranking", (req, res) => {
  const url = "https://dpjam.net/ranking";
  axios.get(url).then(({ data }) => {
    fs.writeFileSync("data/ranking.html", data, (err) => {
      if (err) {
        console.error(err);
        return;
      }
    });
  });
  console.log("Successfully written ranking to file");
  res.sendStatus(200);
});

//Download User Ranking
app.get("/user-ranking", (req, res) => {
  const reqName = req.params.name;
  const id = getID(reqName);
  const url = "https://dpjam.net/ranking";
  axios.get(url).then(({ data }) => {
    const $ = cheerio.load(data);
    const musics = [];
    const sel = "div.table-responsive-lg > table > tbody > tr";
    const keys = ["UserID", "Nickname", "Tier", "Clear"];
    $(sel).each(function () {
      let keyIndex = 0;
      const musicDetails = {};
      $(this)
        .find("a")
        .each(function (i, link) {
          musicDetails[keys[keyIndex]] = $(link).attr("href").match(/\d+/)[0];
          keyIndex++;
        });

      $(this)
        .find("td")
        .each(function () {
          musicDetails[keys[keyIndex]] = $(this).text().trim();
          keyIndex++;
        });
      musics.push(musicDetails);
    });
    fs.writeFileSync(
      "data/users.json",
      // "data/" + id + ".json",
      JSON.stringify(musics, null, 2),
      {
        encoding: "utf8",
        flag: "w",
      },
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
      }
    );
  });
  console.log("Successfully written ranking to file");

  res.sendStatus(200);
});

//Change Username to ID
// app.get("/user/:name", (req, res) => {
//   const reqName = req.params.name;
//   const ranking = fs.readFileSync("data/ranking.html", { encoding: "utf8" });
//   const $ = cheerio.load(ranking);
//   const sel = "div.table-responsive-lg > table > tbody > tr";
//   let found = false;
//   $(sel).each(function () {
//     $(this)
//       .find("a")
//       .each(function (i, name) {
//         if (reqName == $(name).text()) {
//           const id = $(name).attr("href").match(/\d+/)[0];
//           found = true;
//           return res.json({ id: id });
//         }
//       });
//   });
//   if (found == false) {
//     return res.sendStatus(404);
//   }
// });

//change Username to ID
function getID(reqName) {
  const ranking = fs.readFileSync("data/ranking.html", { encoding: "utf8" });
  const $ = cheerio.load(ranking);
  const sel = "div.table-responsive-lg > table > tbody > tr";
  let finalID = 0;
  $(sel).each(function () {
    $(this)
      .find("a")
      .each(function (i, name) {
        if (reqName == $(name).text()) {
          const id = $(name).attr("href").match(/\d+/)[0];
          finalID = id;
          return;
        }
      });
  });
  if (finalID != 0) {
    return finalID;
  }
}

//Download Score
app.get("/score/:name", (req, res) => {
  const reqName = req.params.name;
  const id = getID(reqName);
  const url = "https://dpjam.net/player-scoreboard/" + id + "/2";
  axios.get(url).then(({ data }) => {
    const $ = cheerio.load(data);
    const musics = [];
    const sel = "div.table-responsive-lg > table > tbody > tr";
    const keys = [
      "Rank",
      "Title",
      "Acc",
      "Progress",
      "Clear",
      "Rank",
      "Level",
      "PlayTime",
    ];
    $(sel).each(function () {
      $(sel).each(function () {
        let keyIndex = 0;
        const musicDetails = {};
        $(this)
          .find("a")
          .each(function (i, link) {
            musicDetails[keys[keyIndex]] = $(link).attr("href").match(/\d+/)[0];
            keyIndex++;
          });

        $(this)
          .find("td")
          .each(function () {
            musicDetails[keys[keyIndex]] = $(this).text().trim();
            keyIndex++;
          });
        musics.push(musicDetails);
      });
      fs.writeFileSync(
        "data/" + id + ".json",
        JSON.stringify(musics, null, 2),
        {
          encoding: "utf8",
          flag: "w",
        },
        (err) => {
          if (err) {
            console.error(err);
            return;
          }
        }
      );
    });
  });
  console.log("Successfully written ranking to file");

  res.sendStatus(200);
});

app.get("/compare/:name1/:name2", (req, res) => {
  const firstName = req.params.name1;
  const secondName = req.params.name2;
  const id1 = getID(firstName);
  const id2 = getID(secondName);

  let win1 = [];

  let rawScore1 = fs.readFileSync("data/" + id1 + ".json");
  let rawScore2 = fs.readFileSync("data/" + id2 + ".json");
  let scoreSet1 = JSON.parse(rawScore1);
  let scoreSet2 = JSON.parse(rawScore2);

  scoreSet1.forEach((score1) => {
    let found = false;
    scoreSet2.forEach((score2) => {
      if (score1.Title == score2.Title) {
        found = true;
        if (parseInt(score1.Rank) > parseInt(score2.Rank)) {
          win1.push(score1);
        }
      }
    });
    if (!found) {
      win1.push(score1);
    }
  });
  return res.json(win1);
});

app.get("/fetch-music", (req, res) => {
  const url = "https://dpjam.net/music?keyword=&option=0&level-min=&level-max=";
  axios.get(url).then(({ data }) => {
    const $ = cheerio.load(data);
    const musics = [];
    const sel = "table > tbody > tr";
    const keys = ["MusicID", "Title", "Artist", "NoteCharter", "Level", "BPM"];

    $(sel).each(function () {
      let keyIndex = 0;
      const musicDetails = {};
      $(this)
        .find("a")
        .each(function (i, link) {
          musicDetails[keys[keyIndex]] = $(link).attr("href").match(/\d+/)[0];
          keyIndex++;
        });

      $(this)
        .find("td")
        .each(function () {
          musicDetails[keys[keyIndex]] = $(this).text().trim();
          keyIndex++;
        });
      musics.push(musicDetails);
    });
    fs.writeFileSync(
      "data/musics.json",
      JSON.stringify(musics, null, 2),
      {
        encoding: "utf8",
        flag: "w",
      },
      (err) => {
        if (err) {
          console.error(err);
          return;
        }
      }
    );
    console.log("Successfully written data to file");
    res.sendStatus(200);
  });
});

//Get all scores in a song Hard Difficulty
app.get("/scoreboard/:musicid/:difficulty", (req, res) => {
  var requestedMusicID = req.params.musicid;
  var requestedDifficulty = req.params.difficulty;
  const url =
    "https://dpjam.net/music-scoreboard/" +
    requestedMusicID +
    "/" +
    requestedDifficulty;
  axios.get(url).then(({ data }) => {
    const $ = cheerio.load(data);
    const scores = [];
    const sel = "table > tbody > tr";
    const keys = [
      "UserID",
      "Nickname",
      "Cool",
      "Good",
      "Bad",
      "Miss",
      "MaxCombo",
      "Acc",
      "Progress",
      "Clear",
      "PlayTime",
    ];
    $(sel).each(function (parentIndex, parentElem) {
      let keyIndex = 0;
      const scoreDetails = {};
      $(this)
        .find("a")
        .each(function (i, link) {
          scoreDetails[keys[keyIndex]] = $(link).attr("href").match(/\d+/)[0];
          keyIndex++;
        });

      $(this)
        .find("td")
        .each(function (i, e) {
          scoreDetails[keys[keyIndex]] = $(this).text().trim();
          keyIndex++;
        });
      scores.push(scoreDetails);
    });
    res.json(scores);
  });
});

async function getScores(urls) {
  await axios
    .all(urls.map((url) => axios.get(url)))
    .then((data) => {
      data.forEach((response) => {
        const musicID = response.config.url.match(/\d+/)[0];
        const $ = cheerio.load(response.data);
        const scores = [];
        const sel = "table > tbody > tr";
        const keys = [
          "UserID",
          "Nickname",
          "Cool",
          "Good",
          "Bad",
          "Miss",
          "MaxCombo",
          "Acc",
          "Progress",
          "Clear",
          "PlayTime",
        ];

        $(sel).each(function (parentIndex, parentElem) {
          let keyIndex = 0;
          const scoreDetails = {};
          $(this)
            .find("a")
            .each(function (i, link) {
              scoreDetails[keys[keyIndex]] = $(link)
                .attr("href")
                .match(/\d+/)[0];
              keyIndex++;
            });

          $(this)
            .find("td")
            .each(function (i, e) {
              scoreDetails[keys[keyIndex]] = $(this).text().trim();
              keyIndex++;
            });
          scores.push(scoreDetails);
        });

        // const selCounts = "div.container-fluid > div.info-header > h4"

        // $(selCounts).each(function () {
        //   const counts = $(this).find('br').get(0).nextSibling.nodeValue.match(/\d+/)[0]
        //   if(counts){
        //     let rawdata = fs.readFileSync("data/musics.json");
        //     let musics = JSON.parse(rawdata);

        //     musics.forEach((music) => {
        //       if(music.MusicID == musicID){
        //         music.PlayCount = parseInt(counts)
        //       }
        //     }
        //     )
        //     fs.writeFileSync(
        //       "data/musics.json",
        //       JSON.stringify(musics, null, 2),
        //       {
        //         encoding: "utf8",
        //         flag: "w",
        //       },
        //       (err) => {
        //         if (err) {
        //           console.error(err);
        //           return;
        //         }
        //       }
        //     )

        //     // data=musicID+","+counts+"\n"
        //     // fs.appendFile('data/playcount/playcount.txt', data, (err) => {
        //     //   if (err) throw err;
        //     // });
        //   }
        // })

        // $(sel).each(function () {
        //   let keyIndex = 0;
        //   const scoreDetails = {};
        //   $(this)
        //     .find("a")
        //     .each(function (i, link) {

        //       scoreDetails[keys[keyIndex]] = $(link).attr("href").match(/\d+/)[0];
        //       keyIndex++;
        //     });
        //   $(this)
        //     .find("td")
        //     .each(function (i, e) {
        //       scoreDetails[keys[keyIndex]] = $(this).text().trim();
        //       keyIndex++;
        //     });
        //   scores.push(scoreDetails);
        // });
        fs.writeFileSync(
          "data/score/" + musicID + ".json",
          JSON.stringify(scores, null, 2),
          {
            encoding: "utf8",
            flag: "w",
          },
          (err) => {
            if (err) {
              console.log(musicID);
              console.error(err);
              return;
            }
          }
        );
      });
    })
    .catch((error) => {
      console.log(error);
    })
    .then(() => {
      console.log("Fetch Done");
    });
}

app.get("/fetch-score", async (req, res) => {
  let rawdata = fs.readFileSync("data/musics.json");

  let musics = JSON.parse(rawdata);
  let musicList = [];

  musics.forEach((element) => {
    musicList.push("https://dpjam.net/music-scoreboard/" + element.MusicID);
  });

  let result = [];
  musicList.forEach((x, y, z) =>
    !(y % 300) ? result.push(z.slice(y, y + 300)) : ""
  );
  // console.log(result.length)
  // result.forEach((x) => console.log(x.length));
  for (let i = 0; i < result.length; i++) {
    // console.log(result[i].length)
    await getScores(result[i]);
  }

  res.sendStatus(200);
});

// app.get("/visualize", (req, res) => {
//   let rawdata = fs.readFileSync("data/musics.json");
//   let musics = JSON.parse(rawdata);
//   let scoreData = [];
//   musics.forEach((music) => {
//     let rawScoreData = fs.readFileSync("data/score/" + music.MusicID + ".json");
//     let scores = JSON.parse(rawScoreData)
//     scores.forEach((score) => {

//       var index = scoreData.findIndex(function(item, i){
//         return item.Level === music.Level
//       });
//       if(index!=-1){
//         if(score.Clear === "Clear"){
//           scoreData[index].Clear++;
//         }else{
//           scoreData[index].Failed++;
//         }
//       }else{
//         scoreData.push({
//           Level: music.Level,
//           Clear: 0,
//           Failed: 0,
//         })
//       }
//     })

//   })
//   res.json(scoreData);

// })

app.get("/analyze", (req, res) => {
  let rawdata = fs.readFileSync("data/musics.json");
  let musics = JSON.parse(rawdata);

  let rawdata2 = fs.readFileSync("data/users.json");
  let userlist = JSON.parse(rawdata2);

  musics.forEach((music) => {
    let rawScoreData = fs.readFileSync("data/score/" + music.MusicID + ".json");
    let scores = JSON.parse(rawScoreData);
    let userClearLevel = 0;
    let userClearLevelCount = 0;

    let userDRank = 0;
    let userDRankCount = 0;

    let userLowestClear = [];

    scores.forEach((score) => {
      if (score.Clear === "Cleared") {
        let user = userlist.filter(function (element) {
          return element.UserID === score.UserID;
        });
        let userLevel = parseInt(user[0].Clear);
        if (userLevel != 0) {
          userClearLevel = userClearLevel + userLevel;
          userClearLevelCount++;

          userLowestClear.push(userLevel);

          if (score.Progress === "D Rank") {
            userDRank = userDRank + userLevel;
            userDRankCount++;
          }
        }
      }
    });

    let avgClear = userClearLevel / userClearLevelCount;
    let avgDrank = userDRank / userDRankCount;

    music.AvgClear = Math.round(avgClear);
    music.AvgDRank = Math.round(avgDrank);
    music.LowestClear = Math.min(...userLowestClear);
  });

  fs.writeFileSync(
    "data/analyzed.json",
    JSON.stringify(musics, null, 2),
    {
      encoding: "utf8",
      flag: "w",
    },
    (err) => {
      if (err) {
        console.error(err);
        return;
      }
    }
  );
  res.json(musics);
});

app.listen(port, "0.0.0.0", () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
