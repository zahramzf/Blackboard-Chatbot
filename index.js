
const fs = require("fs");
const _ = require("lodash");
const wiki = require("wikipedia");
const convert = require("convert-units");
const { lowerCase } = require("lower-case");
const { capitalCase } = require("change-case");
const extractValues = require("extract-values");
const stringSimilarity = require("string-similarity");
const { upperCaseFirst } = require("upper-case-first");

const cors = require("cors");
const path = require("path");
const axios = require("axios");
const morgan = require("morgan");
const dotenv = require("dotenv");
const express = require("express");
const compression = require("compression");
const serveStatic = require("serve-static");
const bodyParser = require("body-parser");

const pkg = require("./package.json");
const mainChat = require("./intents/Main_Chat.json");
const supportChat = require("./intents/support.json");
const wikipediaChat = require("./intents/wikipedia.json");
const welcomeChat = require("./intents/Default_Welcome.json");
const fallbackChat = require("./intents/Default_Fallback.json");
const unitConverterChat = require("./intents/unit_converter.json");
const examChat = require("./intents/answers.json");

dotenv.config();
const fss = require('fs').promises;
const process = require('process');
const {authenticate} = require('@google-cloud/local-auth');
const {google} = require('googleapis');

const standardRating = 0.6;
const botName = process.env.BOT_NAME || pkg.name;
const developerName = process.env.DEVELOPER_NAME || pkg.author.name;
const developerEmail = process.env.DEVELOPER_EMAIL || pkg.author.email;
const bugReportUrl = process.env.DEVELOPER_NAME || pkg.bugs.url;

const app = express();
const port = process.env.PORT || 4000;


// Google Calendar
const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];

const TOKEN_PATH = path.join(process.cwd(), 'token.json');
const CREDENTIALS_PATH = path.join(process.cwd(), 'credentials.json');

async function loadingcredential() {
  try {
    const content = await fss.readFile(TOKEN_PATH);
    const credentials = JSON.parse(content);
    return google.auth.fromJSON(credentials);
  } catch (err) {
    return null;
  }
}

async function credentialsaving(client) {
  const content = await fss.readFile(CREDENTIALS_PATH);
  const key1 = JSON.parse(content);
  const key2 = key1.installed || key1.web;
  const loadpaying = JSON.stringify({
    type: 'authorized_user',
    client_id: key2.client_id,
    client_secret: key2.client_secret,
    refresh_token: client.credentials.refresh_token,
  });
  await fss.writeFile(TOKEN_PATH, loadpaying);
}

async function authorization() {
  let client = await loadingcredential();
  if (client) {
    return client;
  }
  client = await authenticate({
    scopes: SCOPES,
    keyfilePath: CREDENTIALS_PATH,
  });
  if (client.credentials) {
    await credentialsaving(client);
  }
  return client;
}

let newEvents = [];
async function Events(auth) {
  const calendar = google.calendar({version: 'v3', auth});
  const res = await calendar.events.list({
    calendarId: 'primary',
    timeMin: new Date().toISOString(),
    // maxResults: 10,
    singleEvents: true,
    orderBy: 'startTime',
  });
  const events = res.data.items;
  if (!events || events.length === 0) console.log('No upcoming events found.')
  // const findValue = events.find(event => event.summary == eventname);
  newEvents = events;
}
authorization().then(Events).catch(console.error);
// Google Calendar

let allQustions = [];

allQustions = _.concat(allQustions, wikipediaChat);
allQustions = _.concat(allQustions, unitConverterChat);
allQustions = _.concat(
  allQustions,
  _.flattenDeep(_.map(supportChat, "questions")),
);
allQustions = _.concat(
  allQustions,
  _.flattenDeep(_.map(mainChat, "questions")),
);

allQustions = _.uniq(allQustions);
allQustions = _.compact(allQustions);


const changeUnit = (amount, unitFrom, unitTo) => {
  try {
    const convertValue = convert(amount).from(unitFrom).to(unitTo);
    const returnMsg = `${amount} ${convert().describe(unitFrom).plural}(${
      convert().describe(unitFrom).abbr
    }) is equle to ${convertValue} ${convert().describe(unitTo).plural}(${
      convert().describe(unitTo).abbr
    }).`;

    return returnMsg;
  } catch (error) {
    return error.message;
  }
};

const sendAllQuestions = (req, res) => {
  const humanQuestions = [];

  try {
    allQustions.forEach((qus) => {
      if (qus.length >= 15) {
        if (
          /^(can|are|may|how|what|when|who|do|where|your|from|is|will|why)/gi.test(
            qus,
          )
        ) {
          humanQuestions.push(`${upperCaseFirst(qus)}?`);
        } else {
          humanQuestions.push(`${upperCaseFirst(qus)}.`);
        }
      }
    });
    res.json(_.shuffle(humanQuestions));
  } catch (error) {
    res.status(500).send({ error: "Internal Server Error!", code: 500 });
    console.log(error);
  }
};

const sendWelcomeMessage = (req, res) => {
  console.log(__dirname);
  res.json({
    responseText: welcomeChat,
  });
};

const sendAnswer = async (req, res) => {
  let isFallback = false;
  let responseText = null;
  let rating = 0;
  let action = null;

  try {
    const query = decodeURIComponent(req.query.q).replace(/\s+/g, " ").trim() || "Hello";
    const humanInput = lowerCase(query.replace(/(\?|\.|!)$/gim, ""));

    const regExforUnitConverter = /(convert|change|in).{1,2}(\d{1,8})/gim;
    const regExforWikipedia = /(search for|tell me about|what is|who is)(?!.you) (.{1,30})/gim;
    const regExforSupport = /(invented|programmer|teacher|create|maker|who made|creator|developer|bug|email|report|problems)/gim;
    const regExforExamTime =  /(When is my)(.*) exam/gim;
    const regExforlectureTime =  /(When is my)(.*) lecture/gim;
    const regExforExamDeadline =  /^When is my (.*) deadline\b/gim;

    let similarQuestionObj;

    if (regExforUnitConverter.test(humanInput)) {
      action = "unit_converter";
      similarQuestionObj = stringSimilarity.findBestMatch(
        humanInput,
        unitConverterChat,
      ).bestMatch;
    } else if (regExforWikipedia.test(humanInput)) {
      action = "wikipedia";
      similarQuestionObj = stringSimilarity.findBestMatch(
        humanInput,
        wikipediaChat,
      ).bestMatch;
    } else if (regExforSupport.test(humanInput)) {
      action = "support";
      similarQuestionObj = stringSimilarity.findBestMatch(
        humanInput,
        _.flattenDeep(_.map(supportChat, "questions")),
      ).bestMatch;
    } else if (regExforExamTime.test(humanInput)) {
      action = "exam_date";
      similarQuestionObj = stringSimilarity.findBestMatch(
        humanInput,
        examChat,
      ).bestMatch;
    }
    else {
      action = "main_chat";
      similarQuestionObj = stringSimilarity.findBestMatch(
        humanInput,
        _.flattenDeep(_.map(mainChat, "questions")),
      ).bestMatch;
    }
    
    const similarQuestionRating = similarQuestionObj.rating;
    const similarQuestion = similarQuestionObj.target;
    
    if (action == "unit_converter") {
      const valuesObj = extractValues(humanInput, similarQuestion, {
        delimiters: ["{", "}"],
      });

      rating = 1;
      try {
        const { amount, unitFrom, unitTo } = valuesObj;

        responseText = changeUnit(amount, unitFrom, unitTo);
      } catch (error) {
        responseText = "One or more units are missing.";
        console.log(error);
      }
    } else if (action == "wikipedia") {
      const valuesObj = extractValues(humanInput, similarQuestion, {
        delimiters: ["{", "}"],
      });

      let { topic } = valuesObj;
      topic = capitalCase(topic);

      try {
        const wikipediaResponse = await wiki.summary(topic);
        const wikipediaResponseText = wikipediaResponse.extract;

        if (wikipediaResponseText == undefined || wikipediaResponseText == "") {
          responseText = `Sorry, I can't find any article related to "${topic}".`;
          isFallback = true;
        } else {
          responseText = wikipediaResponseText;
        }
      } catch (error) {
        responseText = `Sorry, we can't find any article related to "${topic}".`;
        console.log(error);
      }
    } else if (action == "support") {
      rating = similarQuestionRating;

      if (similarQuestionRating > standardRating) {
        for (let i = 0; i < supportChat.length; i++) {
          for (let j = 0; j < supportChat[i].questions.length; j++) {
            if (similarQuestion == supportChat[i].questions[j]) {
              responseText = _.sample(supportChat[i].answers);
            }
          }
        }
      }
    } else if (action == "exam_date") {
      const valuesObj = extractValues(humanInput, similarQuestion, {
        delimiters: ["{", "}"],
      });
      let { course_name } = valuesObj;
      course_name = capitalCase(course_name) + " exam";
      const findEvent = newEvents.find(event => event.summary == course_name);
      let responseObj = {
        time : findEvent.start.dateTime,
        link : findEvent.htmlLink,
        location: findEvent.location,
        summary: findEvent.summary
      }
      responseText = responseObj
    }
    else if (
      /(?:my name is|I'm|I am) (?!fine|good)(.{1,30})/gim.test(humanInput)
    ) {
      const humanName = /(?:my name is|I'm|I am) (.{1,30})/gim.exec(humanInput);
      responseText = `Nice to meet you ${humanName[1]}.`;
      rating = 1;
    } else {
      action = "main_chat";

      if (similarQuestionRating > standardRating) {
        for (let i = 0; i < mainChat.length; i++) {
          for (let j = 0; j < mainChat[i].questions.length; j++) {
            if (similarQuestion == mainChat[i].questions[j]) {
              responseText = _.sample(mainChat[i].answers);
              rating = similarQuestionRating;
            }
          }
        }
      } else {
        isFallback = true;
        action = "Default_Fallback";
        if (
          humanInput.length >= 5
          && humanInput.length <= 20
          && !/(\s{1,})/gim.test(humanInput)
        ) {
          responseText = "You are probably hitting random keys :D";
        } else {
          responseText = _.sample(fallbackChat);
        }
      }
    }

    if (responseText == null) {
      responseText = _.sample(fallbackChat);
      isFallback = true;
    } else if (action != "wikipedia" && action != "exam_date") {
      responseText = responseText
        .replace(/(\[BOT_NAME\])/g, botName)
        .replace(/(\[DEVELOPER_NAME\])/g, developerName)
        .replace(/(\[DEVELOPER_EMAIL\])/g, developerEmail)
        .replace(/(\[BUG_URL\])/g, bugReportUrl);
    }

    res.json({
      responseText,
      query,
      rating,
      action,
      isFallback,
      similarQuestion,
    });
  } catch (error) {
    console.log(error);
    if (error.message.includes("URI")) {
      res.status(500).send({ error: error.message, code: 500 });
    } else {
      res.status(500).send({ error: "Internal Server Error!", code: 500 });
    }
  }
};

const notFound = async (req, res) => {
  try {
    const pageNotFoundHtml = await fs.readFileSync(
      path.join(__dirname, "public/404.html"),
      "utf8",
    );
    res.status(404).send(pageNotFoundHtml);
  } catch (err) {
    res.status(404).send("Page Not Found!");
    console.log(err);
  }
};
const addToJsonFile = async (req, res) => {
  const { text } = req.body;
  const newFeedBack = {
    text,
  };
  fs.readFile(path.join(__dirname, "intents", "feedback.json"), (err, jsonString) => {
    if (err) throw err;
    const file = JSON.parse(jsonString);
    file.feedback.push(newFeedBack);
    fs.writeFile(path.join(__dirname, "intents", "feedback.json"), JSON.stringify(file), (err) => {
      if (err) throw err;
    });
    res.json({
      responseText: "Feedback submitted successfully",
    });
  });

  // fs.readFile('data.json', 'utf8', (err, data) => {
  //   if (err) {
  //     console.error('Error reading data from the JSON file:', err);
  //     return;
  //   }

  //   try {
  //     // Step 2: Parse the JSON data into a JavaScript object
  //     const jsonData = JSON.parse(data);

  //     // Step 3: Modify the JavaScript object by adding the new data
  //     jsonData.users.push(newData);

  //     // Step 4: Write the updated JavaScript object back to the JSON file
  //     fs.writeFile('data.json', JSON.stringify(jsonData, null, 2), 'utf8', (err) => {
  //       if (err) {
  //         console.error('Error writing data to the JSON file:', err);
  //         return;
  //       }

  //       console.log('Data added successfully!');
  //     });
  //   } catch (err) {
  //     console.error('Error parsing JSON data:', err);


  //   }
  //   }
  //   }
  // });
};

app.use(cors());
app.use(compression());
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.set("json spaces", 4);
app.use("/api/", morgan("tiny"));
app.get("/api/question", sendAnswer);
app.get("/api/welcome", sendWelcomeMessage);
app.get("/api/allQuestions", sendAllQuestions);
app.post("/api/feedBack", addToJsonFile);
app.use(serveStatic(path.join(__dirname, "public")));
app.get("*", notFound);

app.listen(port, () => console.log(`app listening on port ${port}!`));
