/* global firebase, Vue, daybook, mapSentiment, isSameDay, leftPadZeroes, dateToYMD */
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

const API_ENDPOINT = "https://api.daybook.space/";

window.isSameDay = function(d1, d2) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

window.mapSentiment = function(sentiment) {
  if (sentiment >= 2) {
    return 'icon-emo-grin';
  } else if (sentiment >= 0) {
    return 'icon-emo-happy';
  } else if (sentiment >= -2) {
    return 'icon-emo-displeased';
  } else {
    return 'icon-emo-unhappy';
  }
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

// emitting events: $emit('enlarge-text')
// models: v-model="searchText"
// v-bind:value="value"
// v-on:input="$emit('input', $event.target.value)"
Vue.component('entry-editor', {
  props: ['entryInit', 'idx'],
  computed: {
    entry: function (){
      return Object.assign({}, this.entryInit);
    }
  },
  template: '<div class="grid-card card-full-width">' +
            '<div class="card-content">' +
            '<span class="card-topright">' +
            '<i class="icon-save btn" v-on:click="$emit(\'card-mode-change\', {\'number\': idx, \'mode\': \'entry-viewer\', \'update\':true, \'entry\':entry})"></i>' +
            '<i class="icon-cancel btn" v-on:click="$emit(\'card-mode-change\', {\'number\': idx, \'mode\': \'entry-viewer\', \'update\':false})"></i></span>' +
              '<h2>{{ entry.date == 0 ? \'New Entry\' :' +
              ' entry.date.toLocaleDateString("en-US", {year: \'numeric\', mont' +
              'h: \'long\', day: \'numeric\'}) }}</h2></div>' +
            '<div class="card-content"><textarea v-model="entry.content"></textarea></div>' +
            '<div class="card-content">' +
            '<label for="sleepTime">When did you sleep last night? </label><input name="sleepTime" type="time" v-model="entry.sleepTime"><br />' +
            '<label for="wakeTime">When did you wake up this morning? </label><input name="wakeTime" type="time" v-model="entry.wakeupTime">' +
  '</div>' + '</div>'
});

Vue.component('entry-viewer', {
  props: ['entryInit', 'idx'],
  template: '<div class="grid-card">' +
            '<div class="card-content">' +
            '<span class="card-topright"><i v-bind:class="entryInit.sentimentClass"></i></span>' +
            '<h2>{{ entryInit.date.toLocaleDateString("en-US", {year: \'numeric\', month: \'long\', day: \'numeric\'}) }}</h2>' +
            '<p>{{ entryInit.content }}</p>' +
            '<div class="align-right">' +
            '<i class="icon-pencil btn" v-on:click="$emit(\'card-mode-change\', {\'number\': idx, \'mode\': \'entry-editor\'})"></i>' +
            '</div>' + 
            '</div>' +
            '</div>'
});

/*
Vue.component('entry-summary', {
  props: ['entry', 'idx'],
  template: '<div class="grid-card" v-on:click="$emit(\'card-mode-change\', {\'number\': idx, \'mode\': \'entry-viewer\'})">' +
            '<div class="card-content">' +
            '<h2>{{ entry.date.toLocaleDateString("en-US", {year: \'numeric\', month: \'long\', day: \'numeric\'}) }}</h2>' +
            '<span class="card-topright"><i v-bind:class="entry.sentimentClass"></i></span>' +
            '<p>entry content: {{ entry.content }}</p>' +
            '</div>' +
            '</div>'
});
*/
// Initializes the Daybook app.
function Daybook() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.

    // misc dom elements
    this.styleContainer = document.getElementById('dyn-signin');

    // Initialize the Firebase app.
    firebase.initializeApp(firebaseConfig);

    // Setup Vue app
    this.app = new Vue({
      el: '#daybook-app',
      data: {
        seen: true,
        journalEntries: [],
        cardModes: [],
        userName: 'Unknown User',
        lastEndDate: new Date(),
        seenItems: 0
      },
      methods: {
        signIn: function() {
          firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
        },
        signOut: function() {
          firebase.auth().signOut();
        },
        onAuthStateChanged: function(user) {
          if (user) {
            daybook.styleContainer.textContent = '.cards-signed-out{ display: none; } .cards-signed-in{ display: block; }';
            daybook.signedInUser = user;
            this.userName = user.displayName;
          } else {
            daybook.styleContainer.textContent = '.cards-signed-out{ display: block; } .cards-signed-in{ display: none; }';
            this.journalEntries = [];
            this.cardModes = [];
            this.seenItems++;
          }
        },
        requestCardModeChange: function(opts) {
          const number = opts.number, mode = opts.mode;
          if (this.cardModes[number] == 'entry-editor') {
            if (opts.update) {
              this.journalEntries[number].content = "[uploading to server...]";
              const data = {
                journal: opts.entry.content,
                user: firebase.auth().currentUser.uid,
                date: dateToYMD(opts.entry.date),
                sleep: opts.entry.sleepTime,
                wake: opts.entry.wakeupTime
              };
              const endpoint = API_ENDPOINT + 'updateJournal/' + opts.entry.id;

              daybook.sendAuthenticatedRequest('POST', endpoint, data, function(body, err) {
                if (err) {
                  this.journalEntries[number].content = "[error uploading! please try again later]\n" +
                                                          opts.entry.content;
                  this.journalEntries[number].wakeupTime = opts.entry.wakeupTime;
                  this.journalEntries[number].sleepTime = opts.entry.sleepTime;
                  return;
                }
                if (opts.entry.id == 0) {
                  /* new entry id, set it */
                  opts.entry.id = parseInt(body, 10);
                }
                this.journalEntries[number].content = opts.entry.content;
                this.journalEntries[number].wakeupTime = opts.entry.wakeupTime;
                this.journalEntries[number].sleepTime = opts.entry.sleepTime;
              }.bind(this));
            } else if (this.journalEntries[number].isNew) {
              this.cardModes.shift();
              this.journalEntries.shift();
              return;
            }
          }
          this.journalEntries[number].isNew = false;
          Vue.set(this.cardModes, number, mode);
        },
        addNewCard: function() {
          var d = new Date();
          /* 6am is a reasonable time to have a new day start */
          d.setHours(d.getHours() - 6);
          if (this.journalEntries.length > 0 && isSameDay(this.journalEntries[0].date, d)) return;

          /* add the elements to the array */
          this.journalEntries.unshift({
            content: 'What do you have to say about today?\nWhat did you do?\nDid you meet anyone new?\nDid you learn anything?',
            date: d,
            sentiment: 0,
            sentimentClass: mapSentiment(0),
            wakeupTime: '09:39',
            sleepTime: '22:13',
            isNew: true,
            id: 0
          });
          this.cardModes.unshift('entry-editor');
        },
        infiniteHandler: function($state) {
          if (!firebase || !firebase.auth() || !firebase.auth().currentUser) {
            /* called before auth is set up, so wait a sec*/
            setTimeout(function() {$state.loaded();}, 1000);
            return;
          }

          const newEndDate = new Date(this.lastEndDate);
          newEndDate.setDate(this.lastEndDate.getDate() - 14);
          const endpoint = API_ENDPOINT + 'getJournal/' +
                            firebase.auth().currentUser.uid + '/' +
                            dateToYMD(newEndDate) + '/' +
                            dateToYMD(this.lastEndDate);

          daybook.sendAuthenticatedRequest('GET', endpoint, (bodyRaw, err) => {
            if (err) {
              $state.error();
              return;
            }

            this.lastEndDate = newEndDate;
            const body = JSON.parse(bodyRaw);

            for (var i = 0; i < body.length; i++) {
              body[i]['sentimentClass'] = mapSentiment(body[i].sentiment);
              var dateParts = body[i]['date'].split('-');
              body[i]['date'] = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]);
              this.journalEntries.push(body[i]);
              this.cardModes.push('entry-viewer');
            }

            if (body.length == 0) {
              $state.complete();
            } else {
              $state.loaded();
            }
          });
        },
      }
    });

    firebase.auth().onAuthStateChanged(this.app.onAuthStateChanged);
  }.bind(this));
}

// Does an authenticated request to a Firebase Functions endpoint using an Authorization header.
Daybook.prototype.sendAuthenticatedRequest = function(method, url, body, callback) {
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
window.daybook = new Daybook();
