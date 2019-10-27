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
        chartStats: ,
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
            {sentiment: Math.random(), entity: 'f'}
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
            const newEndDate = new Date();
            newEndDate.setDate(newEndDate.getDate() - this.timeDomain * 7);
            const endpoint = API_ENDPOINT + 'getJournal/' +
                            firebase.auth().currentUser.uid + '/' +
                            dateToYMD(newEndDate) + '/' +
                            dateToYMD(this.lastEndDate);

          daybookstats.sendAuthenticatedRequest('GET', endpoint, (bodyRaw, err) => {
            this.lastEndDate = newEndDate;
            const body = JSON.parse(bodyRaw);

            // 

            this.recalculateStats();
          });


          
        },
        formatSentiment: function (sentiment) {
          return '<span>' + (Math.round(sentiment * 100) / 100) + '</span>';
        },
        recalculateStats: function() {
          var chartSleepHappyByDayElem = document.getElementById('chartSleepHappyByDay');
          var chartHappySadDaysElem = document.getElementById('chartHappySadDays');

          new Chart(chartSleepHappyByDayElem, {
            type: 'line',
            data: {
              datasets: [{
                data: [5, 2, 6, 1, 3],
                backgroundColor: 'rgba(115,7,222,0.5)',
                label: 'Sleep',
                yAxisID: 'A'
              },
              {
                data: [0.2, -0.1, -0.2, 0.4, 0.1],
                backgroundColor: 'rgba(7,222,222,0.5)',
                label: 'Happiness',
                yAxisID: 'B'
              }],
              labels: [
                'June 1, 2019',
                'June 2, 2019',
                'June 3, 2019',
                'June 4, 2019',
                'June 5, 2019'
              ]
            },
            options: {
              scales: {
                yAxes: [{
                  id: 'A',
                  type: 'linear',
                  position: 'left',
                }, {
                  id: 'B',
                  type: 'linear',
                  position: 'right'
                }]
              }
            }
          });

          new Chart(chartHappySadDaysElem, {
            type: 'pie',
            data: {
              datasets: [{
                data: [5, 2],
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
    this.app.onTimestampChanged();
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
