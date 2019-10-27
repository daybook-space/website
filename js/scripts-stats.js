/* global firebase, Vue, daybookstats, Chart, leftPadZeroes, dateToYMD */
'use strict';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAb1fPJhczi4fSAkNsKa5JAO_J2Hhvpn50",
  authDomain: "daybook-space.firebaseapp.com",
  databaseURL: "https://daybook-space.firebaseio.com",
  projectId: "daybook-space",
  storageBucket: "daybook-space.appspot.com",
  messagingSenderId: "471289961982",
  appId: "1:471289961982:web:d4f9ec49dbb8f42b6534af"
};

window.leftPadZeroes = function(num, size) {
    var s = "000000000" + num;
    return s.substr(-size);
};

window.dateToYMD = function(date) {
  return date.getFullYear() + '-' + 
          leftPadZeroes(date.getMonth() + 1, 2) + '-' + 
          leftPadZeroes(date.getDate(), 2);
};

const API_ENDPOINT = "https://api.daybook.space/";

// Initializes the DaybookStats app.
function DaybookStats() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.

    // misc dom elements
    this.styleContainer = document.getElementById('dyn-signin');

    // Initialize the Firebase app.
    firebase.initializeApp(firebaseConfig);

    // Setup Vue app
    this.app = new Vue({
      el: '#daybook-statsapp',
      data: {
        userName: 'Unknown User',
        chartStats: {
          sleepTimes: [],
          sentiments: [],
          timeRange: [],
          sadHappy: [0, 0],
          chartSleepHappyByDay: null,
          chartHappySadDays: null
        },
        events: {
            happy: [
              {sentiment: Math.random(), entity: 'k'},
              {sentiment: Math.random(), entity: 'j'},
              {sentiment: Math.random(), entity: 'i'},
              {sentiment: Math.random(), entity: 'h'},
              {sentiment: Math.random(), entity: 'g'},
              {sentiment: Math.random(), entity: 'g'},
              {sentiment: Math.random(), entity: 'g'}
            ], sad: [
              {sentiment: Math.random(), entity: 'b'},
              {sentiment: Math.random(), entity: 'c'},
              {sentiment: Math.random(), entity: 'd'},
              {sentiment: Math.random(), entity: 'e'},
              {sentiment: Math.random(), entity: 'f'},
              {sentiment: Math.random(), entity: 'z'},
            ]
          },
          people: {happy: [{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'}], sad: [{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'}]},
          places: {happy: [{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'}], sad: [{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'}]},
          other: {happy: [{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'}], sad: [{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'},{entity: 'a'}]},
        timeDomain: 1
      },
      methods: {
        signIn: function() {
          firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
        },
        onAuthStateChanged: function(user) {
          if (user) {
            this.userName = user.displayName;
          } else {
            firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
          }
        },
        onTimestampChanged: function() {
          if (!firebase || !firebase.auth() || !firebase.auth().currentUser) {
            /* called before auth is set up, so wait a sec*/
            return;
          }

          const newEndDate = new Date();
          newEndDate.setDate(newEndDate.getDate() - this.timeDomain * 7);
          const endpoint_journal = API_ENDPOINT + 'getJournal/' +
                          firebase.auth().currentUser.uid + '/' +
                          dateToYMD(newEndDate) + '/' +
                          dateToYMD(new Date());
          const endpoint_emotions = API_ENDPOINT + 'emotionEffectors/' +
                          firebase.auth().currentUser.uid + '/' +
                          dateToYMD(newEndDate) + '/' +
                          dateToYMD(new Date());

          daybookstats.sendAuthenticatedRequest('GET', endpoint_journal, (bodyRaw, err) => {
            const body = JSON.parse(bodyRaw);

            this.chartStats.timeRange = [];
            this.chartStats.sleepTimes = [];
            this.chartStats.sentiments = [];
            this.chartStats.sadHappy[0] = 0;
            this.chartStats.sadHappy[1] = 0;

            for (var i = 0; i < body.length; i++) {
              // time series calc
              var dateParts = body[i]['date'].split('-');
              this.chartStats.timeRange.push(new Date(dateParts[0], dateParts[1] - 1, dateParts[2]));

              // sleep time series calc
              this.chartStats.sleepTimes.push(body[i]['sleepAmount']);

              // happy/sad time series calc
              this.chartStats.sentiments.push(body[i]['sentiment']);

              // happy/sad days pie calc
              if (body[i].sentiment > 0) {
                this.chartStats.sadHappy[1]++;
              } else {
                  this.chartStats.sadHappy[0]++;
              }
            }

            this.recalculateStats();
          });

          daybookstats.sendAuthenticatedRequest('GET', endpoint_emotions, (bodyRaw, err) => {
            const body = JSON.parse(bodyRaw);

            this.events = body['events'];
            this.people = body['people'];
            this.places = body['locations'];
            this.other = body['other'];
          });
        },
        formatSentiment: function (sentiment) {
          return '<span>' + (Math.round(sentiment * 100) / 100) + '</span>';
        },
        recalculateStats: function() {
          var chartSleepHappyByDayElem = document.getElementById('chartSleepHappyByDay');
          var chartHappySadDaysElem = document.getElementById('chartHappySadDays');

          if (this.chartSleepHappyByDay) this.chartSleepHappyByDay.destroy();
          this.chartSleepHappyByDay = new Chart(chartSleepHappyByDayElem, {
            type: 'line',
            data: {
              datasets: [{
                data: this.chartStats.sleepTimes,
                backgroundColor: 'rgba(115,7,222,0.5)',
                label: 'Sleep',
                yAxisID: 'A'
              },
              {
                data: this.chartStats.sentiments,
                backgroundColor: 'rgba(7,222,222,0.5)',
                label: 'Happiness',
                yAxisID: 'B'
              }],
              labels: this.chartStats.timeRange
            },
            options: {
              scales: {
                yAxes: [{
                  id: 'A',
                  type: 'linear',
                  position: 'left',
                  scaleLabel: {
                    display: true,
                    labelString: 'Sleep'
                  }
                }, {
                  id: 'B',
                  type: 'linear',
                  position: 'right',
                  scaleLabel: {
                    display: true,
                    labelString: 'Happiness'
                  }
                }],
                xAxes: [{
                  type: 'time',
                  time: {
                      unit: 'day'
                  }
                }]
              }
            }
          });

          if (this.chartHappySadDays) this.chartHappySadDays.destroy();
          this.chartHappySadDays = new Chart(chartHappySadDaysElem, {
            type: 'pie',
            data: {
              datasets: [{
                data: this.chartStats.sadHappy,
                backgroundColor: [
                  '#DE0707',
                  '#72DE07'
                ],
              }],
              labels: [
                'Sad',
                'Happy'
              ]
            }
          });
        }
      }
    });

    firebase.auth().onAuthStateChanged(this.app.onAuthStateChanged);
    setTimeout(function() {
      this.app.onTimestampChanged();
    }.bind(this), 1000);
  }.bind(this));
}

// Does an authenticated request to a Firebase Functions endpoint using an Authorization header.
DaybookStats.prototype.sendAuthenticatedRequest = function(method, url, body, callback) {
  if (method == 'POST' || method == 'PUT') {
    // We are expecting a body, so the callback would be the 4th argument
  } else if (method == 'GET') {
    // The 3rd argument is the callback, not the body
    callback = body;
    body = null;
  } else {
    // Unsupported
    if (callback) callback(null, 'Unsupported HTTP method!');
    return;
  }

  // Authenticate the user before sending anything
  firebase.auth().currentUser.getIdToken().then(function(token) {
    var req = new XMLHttpRequest();
    req.onload = function() {
      if (callback) callback(req.responseText);
    }.bind(this);
    req.onerror = function(err) {
      if (callback) callback(null, err);
    }.bind(this);
    req.open(method, url, true);
    req.setRequestHeader('Authorization', 'Bearer ' + token);
    if (body) {
      // POST/PUT request has a JSON body
      req.setRequestHeader("Content-Type", "application/json;charset=UTF-8");
      req.send(JSON.stringify(body));
    } else {
      req.send();
    }
  }.bind(this));
};

// Load the app
window.daybookstats = new DaybookStats();
