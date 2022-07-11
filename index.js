const express = require("express");
const axios = require("axios");
const cheerio = require("cheerio");
const bodyParser = require("body-parser");
const fs = require("fs");

const app = express();
const port = process.env.PORT || 3000;

app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);

app.get("/fetch-music", (req, res) => {
  const url = "https://dpjam.net/music?keyword=&option=0&lvl-min=&lvl-max=";
  axios.get(url).then(({ data }) => {
    const $ = cheerio.load(data);
    const musics = [];
    const sel = "div.container-fluid > table > tbody > tr";
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

app.get("/score/:musicid/:difficulty", (req, res) => {
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
    const sel = "div.container-fluid > table > tbody > tr";
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

async function getScores(urls){
  await axios
    .all(urls.map((url) =>axios.get(url)))
    .then((data) => {
      data.forEach((response) => {
        const musicID = response.config.url.match(/\d+/)[0];
        const $ = cheerio.load(response.data);
        const scores = [];
        const sel = "div.container-fluid > table > tbody > tr";
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
        ]

        const selCounts = "div.container-fluid > div.info-header > h4"

        $(selCounts).each(function () {
          const counts = $(this).find('br').get(0).nextSibling.nodeValue.match(/\d+/)[0]
          if(counts){
            let rawdata = fs.readFileSync("data/musics.json");
            let musics = JSON.parse(rawdata);

            musics.forEach((music) => {
              if(music.MusicID == musicID){
                music.PlayCount = parseInt(counts)
              }
            }
            )
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
            )
            

            // data=musicID+","+counts+"\n"
            // fs.appendFile('data/playcount/playcount.txt', data, (err) => {
            //   if (err) throw err;
            // });
          }
        })

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
        //   fs.writeFileSync(
        //     "data/score/" + musicID + ".json",
        //     JSON.stringify(scores, null, 2),
        //     {
        //       encoding: "utf8",
        //       flag: "w",
        //     },
        //     (err) => {
        //       if (err) {
        //         console.log(musicID);
        //         console.error(err);
        //         return;
        //       }
        //     }
        //   );
      })

    })
    .catch((error) => {
      console.log(error)
    }).then(()=>{
      console.log("Fetch Done")
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
  musicList.forEach((x,y,z) => !(y % 300) ? result.push(z.slice(y, y + 300)) : '');
  // console.log(result.length)
  // result.forEach((x) => console.log(x.length));
  for (let i = 0; i < result.length; i++) {
    // console.log(result[i].length)
    await getScores(result[i]);
  }
  
  res.sendStatus(200);
});

app.get("/visualize", (req, res) => {
  let rawdata = fs.readFileSync("data/musics.json");
  let musics = JSON.parse(rawdata);
  let scoreData = [];
  musics.forEach((music) => { 
    let rawScoreData = fs.readFileSync("data/score/" + music.MusicID + ".json");
    let scores = JSON.parse(rawScoreData)
    scores.forEach((score) => {

      var index = scoreData.findIndex(function(item, i){
        return item.Level === music.Level
      });
      if(index!=-1){
        if(score.Clear === "Clear"){
          scoreData[index].Clear++;
        }else{
          scoreData[index].Failed++;
        }
      }else{
        scoreData.push({
          Level: music.Level,
          Clear: 0,
          Failed: 0,
        })
      }
    })



  })
  res.json(scoreData);

})

app.listen(port, "0.0.0.0", () => {
  console.log(`Example app listening at http://localhost:${port}`);
});


