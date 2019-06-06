
const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');
const express=require("express");
const bp=require("body-parser")

var app=express();
app.set("view engine","ejs");
app.use(bp.json());
// If modifying these scopes, delete token.json.
const SCOPES = ['https://www.googleapis.com/auth/classroom.courses.readonly',
'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
];
// The file token.json stores the user's access and refresh tokens, and is
// created automatically when the authorization flow completes for the first
// time.
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Classroom API.
  authorize(JSON.parse(content), listCourses);

});


/**
 * Create an OAuth2 client with the given credentials, and then execute the
 * given callback function.
 * @param {Object} credentials The authorization client credentials.
 * @param {function} callback The callback to call with the authorized client.
 */
function authorize(credentials, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client);
  });
}

//authorize for coursewok
function authorize_coursework(credentials,id, callback) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client, callback);
    oAuth2Client.setCredentials(JSON.parse(token));
    callback(oAuth2Client,id);
  });
}



/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback for the authorized client.
 */
function getNewToken(oAuth2Client, callback) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
      callback(oAuth2Client);
    });
  });
}

/*
 *
 * Lists the first 10 courses the user has access to.
 *
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
var c,cw;
function listCourses(auth) {
  const classroom = google.classroom({version: 'v1',auth });
  classroom.courses.list({
    pageSize: 10,
  }, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    c = res.data.courses;
    if (c && c.length) {
      console.log("Courses retrieved");
      // console.log('Courses:');
      // courses.forEach((course) => {
      //   console.log(`${course.name} (${course.id})`);

      // });
    } else {
      console.log('No courses found.');
    }
  });
  
}

//List down the assignments and work
function LIST_coursework(auth,id){
  
  const classwork = google.classroom({ version: 'v1', auth, id});
classwork.courses.courseWork.list({pageSize: 10, courseId:id,}, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    cw = res.data.courses.courseWork;
    if (c && c.length) {
      console.log("Coursework retrieved");
      // console.log('Courses:');
      // courses.forEach((course) => {
      //   console.log(`${course.name} (${course.id})`);

      // });
    } else {
      console.log('No courses found.');
    }
  });
}


app.get("/getcourse",function(req,res){

res.render("course", {c:c});

});
var id;
app.post("/getwork",function(req,res){
id=req.body.in;
fs.readFile('credentials.json', (err, content) => {
  if (err) return console.log('Error loading client secret file:', err);
  // Authorize a client with credentials, then call the Google Classroom API.
  authorize_coursework(JSON.parse(content),id, LIST_coursework);
  res.render("coursework", {cw:cw});
});

});


app.listen(3000,function(){

  console.log("server running at following link: http://localhost:3000 ");
});