/* global firebase, Vue, orc */
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

// API config
const API_BACKEND = 'http://c9.anjurik.ml:3000';

// Initializes the Daybook app.
function Daybook() {
  document.addEventListener('DOMContentLoaded', function() {
    // Shortcuts to DOM Elements.
    // buttons
    this.signInButton = document.getElementById('btn-sign-in');
    this.signOutButton = document.getElementById('btn-sign-out');
    this.addEntryButton = document.getElementById('btn-add-entry');

    // form elements
    this.entryMainText = document.getElementById('entry-main');
/*
this.entryMainText.oninput = function() {
  this.entryMainText.style.height = ""; // Reset the height
  this.entryMainText.style.height = Math.min(this.entryMainText.scrollHeight, 200) + "px";
}.bind(this);
*/

    // misc dom elements
    this.styleContainer = document.getElementById('dyn-signin');
    this.userNameContainer = document.getElementById('user-name');

    // Initialize the Firebase app.
    firebase.initializeApp(firebaseConfig);

    // Bind events.
    this.signInButton.addEventListener('click', this.signIn.bind(this));
    this.signOutButton.addEventListener('click', this.signOut.bind(this));
    this.addEntryButton.addEventListener('click', this.addEntryBegin.bind(this));
    firebase.auth().onAuthStateChanged(this.onAuthStateChanged.bind(this));
    this.signedInUser = null;

    // Setup Vue app

  }.bind(this));
}

// Triggered on Firebase auth state change.
Daybook.prototype.onAuthStateChanged = function(user) {
  if (user) {
    this.styleContainer.textContent = '.cards-signed-out{ display: none !important; } .cards-signed-in{ display: block !important; }';
    this.signedInUser = user;
    this.userNameContainer.textContent = this.signedInUser.displayName;
  } else {
    this.styleContainer.textContent = '.cards-signed-out{ display: block !important; } .cards-signed-in{ display: none !important; }';
  }
};

// Initiates the sign-in flow using GoogleAuthProvider sign in in a popup.
Daybook.prototype.signIn = function() {
  firebase.auth().signInWithPopup(new firebase.auth.GoogleAuthProvider());
};

// Signs-out of Firebase.
Daybook.prototype.signOut = function() {
  firebase.auth().signOut();
};

// Expands the card to fill the screen
Daybook.prototype.expandedEntryBeginCard = false;
Daybook.prototype.addEntryBegin = function() {
  console.log('hi');
  if (this.expandedEntryBeginCard) return;
  this.expandedEntryBeginCard = true;

  document.getElementById('add-card').classList.add('card-full-width');
  document.getElementById('add-entry-inside').classList.remove('hidden');
  document.getElementById('add-entry-inside').classList.add('hiding');
  document.getElementById('add-entry-inside').classList.add('hiding-1');
  this.addEntryButton.classList.add('hiding-1');
  setTimeout(function() {
    this.addEntryButton.classList.add('hiding');
    document.getElementById('add-entry-inside').classList.remove('hiding-1');
    setTimeout(function() {
      this.addEntryButton.classList.add('hidden');
      document.getElementById('add-entry-inside').classList.remove('hiding');
    }.bind(this), 500);
  }.bind(this), 500);
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
