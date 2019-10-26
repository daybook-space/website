/* global firebase, Vue, daybook */
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

// emitting events: $emit('enlarge-text')
// models: v-model="searchText"
// v-bind:value="value"
// v-on:input="$emit('input', $event.target.value)"
Vue.component('entry-editor', {
  data: function () {
    return {
      count: 0
    }
  },
  
  props: ['title'],
  template: '<button v-on:click="count++">You editor me {{ count }} times.</button>'
});

Vue.component('entry-viewer', {
  props: ['title'],
  template: '<button v-on:click="count++">You viewer me {{ count }} times.</button>'
});

Vue.component('entry-summary', {
  props: ['entry', 'idx'],
  template: '<div class="card-content">' +
            '<h2>{{ entry.date.toLocaleDateString("en-US", {year: \'numeric\', month: \'long\', day: \'numeric\'}) }}</h2>' +
            '<p>entry content: {{ entry.content }}</p>' +
            '<div class="align-right">' +
            '<i class="icon-pencil" v-on:click="$emit(\'card-mode-change\', {\'number\': idx, \'mode\': \'entry-viewer\'})"></i>' +
            '</div>' + 
            '</div>'
});

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
        userName: 'Unknown User'
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
          }
        },
        requestCardModeChange: function(opts) {
          console.log('hi', opts);
          const number = opts.number, mode = opts.mode;
          this.cardModes[number] = mode;
          console.log(this.cardModes[number]);
        },
        expandCard: function(number) {
          this.cardModes[number] = 'entry-editor';
        },
        infiniteHandler: function($state) {
          setTimeout(() => {
            const temp = [];
            const temp2 = [];
            for (let i = this.journalEntries.length + 1; i <= this.journalEntries.length + 20; i++) {
              temp.push({content: "bob " + i, date: new Date(Date.now() - i * 1000 * 60 * 60 * 24)});
              temp2.push('entry-summary');
            }
            this.journalEntries = this.journalEntries.concat(temp);
            this.cardModes = this.cardModes.concat(temp2);
            $state.loaded();
          }, 1000);
        },
      }
    });

    firebase.auth().onAuthStateChanged(this.app.onAuthStateChanged);
  }.bind(this));
}

// Triggered on Firebase auth state change.
Daybook.prototype.onAuthStateChanged = function(user) {
  
};

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
