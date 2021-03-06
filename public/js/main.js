var socket = io(),
    storyContainer = $("#padded-story-container"),
    storyPrompt,
    storyBody = $("#story-body"),
    storyProgress,
    userData = '',
    guid = '',
    username = '',
    lastProgressUpdate = 0;

socket.on('loginNameExists', function(data) {
  console.log('exists');
});

socket.on('loginNameBad', function(data) {
  console.log('bad');
});

socket.on('loginNoRoom', function(data) {
  console.log('no room');
});

socket.on('acceptLogin', function(id) {
  guid = id;
});

socket.on('onlineUsers', function(users) {

    console.log(users);

    userData = JSON.parse(users);

    var sideBar = $('#side-bar'),
        stringSection1 = "<div class='name-tag'> <svg fill='grey' id=",
        stringSection2 = " height='24' width='24' viewBox='0 0 24 24' xmlns='http://www.w3.org/2000/svg'><path d='M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z'><path d='M0 0h24v24H0z' fill='none'></path></path></svg>",
        stringSection3 = " <p class='name' style='color: ",
        stringSection4 = " '> ",
        stringSection5 = "</p></div>";

    sideBar.empty().append('');

    for(i in userData) {
        var text = stringSection1 + userData[i].username + stringSection2 + stringSection3 + userData[i].textColor + stringSection4 + userData[i].username + stringSection5;
        sideBar.append(text);
    }

  //$('#messages').append($('<li>').text(msg));
  /*

  [{
    username: 'username',
    textColor: '#ffffff'
  },
  {
    username: 'username',
    textColor: '#ffffff'
  }
  ]

  */
});

socket.on('prompt', function(prompt) {
    console.log(prompt);
    // prompt is a string
    storyPrompt.innerHTML = prompt;
});

socket.on('story', function(fullStory) {
  // [
  //   update: {
  //     user: {
  //       username: 'username',
  //       textColor: '#ffffff'
  //     },
  //     body: 'this is the beginning'
  //   },
  //   update: {
  //     user: {
  //       username: 'username',
  //       textColor: '#ffffff'
  //     },
  //     body: 'this is the middle'
  //   },
  //   update: {
  //     user: {
  //       username: 'username',
  //       textColor: '#ffffff'
  //     },
  //     body: 'this is the end'
  //   }
  // ]
});

socket.on('storyUpdate', function(update) {
    update = JSON.parse(update);
    storyBody.append("<span style='color:" + update.textColor + "'> " + update.body + "</span>");

  // addition to the story - append to the end
  // {
  //   textColor: "#ffffff",
  //   body: 'this is an update'
  // }
});

socket.on('storyProgress', function(progress) {
    console.log(progress);
    progress = JSON.parse(progress);
    if (progress.body) {
      storyProgress.empty().append("<span style='color:" + progress.textColor + "'>" + progress.body + "</span>");
    }
  // Constant update
  // {
  //   textColor: "#ffffff",
  //   body: 'this is the next update'
  // }
});

function applyTimer() {
  var barOverlay = document.getElementById('loading-overlay');
  barOverlay.className = "loading-timer";
  barOverlay.style.height = '100%';
}

function startTimer(textColor) {
    console.log(textColor);
    var barOverlay = document.getElementById('loading-overlay');

    $("#loading-bar").css("border-color", textColor);
    barOverlay.className = "";
    barOverlay.style.height = '0px';
    setTimeout(applyTimer, 10);

}

socket.on('userTurn', function(userTurn) {
    console.log(userTurn);
    // userTurn is a string, username of the user's whose turn is beginning
    var textColor = '#ffffff';
    var editIcon;
    for(i in userData) {
        editIcon = document.getElementById(userData[i].username);
        editIcon.style.fill = 'grey';
        if(userTurn == userData[i].username) {
            textColor = userData[i].textColor;
            startTimer(userData[i].textColor);
        }
    }

    editIcon = document.getElementById(userTurn);
    editIcon.style.fill = textColor;

    if (username == userTurn) {
      storyArea = document.getElementById('storyTextArea');
      if (!storyArea) {
        var $div = $("<textarea>", {id: "storyTextArea", style: 'color:' + textColor});
        storyContainer.append($div);
        storyArea = document.getElementById('storyTextArea');
      }
      storyArea.style.color = textColor;
      storyArea.focus();
      storyArea.onkeyup = function() {
          var seconds = new Date().getTime() / 1000;
          if (seconds - lastProgressUpdate > 1) {
              // Update the other users every 1 second of typing
              var text = storyArea.value;
              socket.emit('storyProgress', JSON.stringify({body: text, guid: guid}));
              lastProgressUpdate = seconds;
          }
      };
    }
});

socket.on('endTurn', function(endTurn) {
    console.log(endTurn);
  // User's turn ends - send back text
    if (username == endTurn) {
      var text = $("#storyTextArea").val();
      $("#storyTextArea").remove();
      socket.emit("storyUpdate", JSON.stringify({body: text, guid: guid}));
    }

    storyProgress.empty().append("");
});


$(document).ready(function() {

    storyPrompt = document.getElementById('prompt-body');
    storyProgress = $('#progress-body');

    username = String(Math.floor(Math.random() * 1000) + 1000);
    function login() {
        socket.emit("login", username);
    }

    function test() {
        var overlay = document.getElementById('loading-overlay');
        overlay.style.height = "100%";
    }

    setTimeout(login, 1000);
});
