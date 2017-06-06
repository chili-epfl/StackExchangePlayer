var player = videojs('my-video');
var time = 0; //use to register the time when user paused the video
var currentTime = 0;
var vtt = new Array(); //Array with all the subtitels
var Time = new Array(); //time array with min max and index
var wantedVTT = new Array();
var baseURL = 'http://stackoverflow.com/questions/'; //Use to acces stackoverflow with question id
var index = 0; //Use to acess the array of timeHelp
var configPause = 0;
var configHelp = 0;
var timeDisplay = -11;
var timeDisplayHelp = -11;
var titleHelp = 'Help';
var overlayHelp = '<button onclick="help()">' + titleHelp + '</button>';

var overlay = [
  {
    title: titleHelp,
    content: overlayHelp,
    start: timeDisplayHelp,
    end: timeDisplayHelp,
    align: 'bottom-left'
  },
  {
    title: '',
    content: '',
    start: 0,
    end: timeDisplay,
    align: 'left'
  },
  {
    title: '',
    content: '',
    start: 0,
    end: timeDisplay,
    align: 'left2'
  },
  {
    title: '',
    content: '',
    start: timeDisplay,
    end: timeDisplay,
    align: 'left3'
  },
  {
    title: '',
    content: '',
    start: timeDisplay,
    end: timeDisplay,
    align: 'left4'
  },
  {
    title: '',
    content: '',
    start: timeDisplay,
    end: timeDisplay,
    align: 'left5'
  }
];

var time = function(min, max, index) {
  this.min = min;
  this.max = max;
  this.index = index;
};

$.getJSON('//freegeoip.net/json/?callback=?', function(data) {
  var ip = data['ip'];
  var country = data['country_name'];
  var city = data['city'];
  SendActivity(
    'init video',
    ip + ';' + country + ';' + city + ';' + new Date().getTime()
  );
});

//--- INITIALIZE TIMEHELP, VTT (SUBTITLE ARRAY) AND TIME ARRAY---//
var timeHelp = ReadAsArray('uploads/time.vtt');
vtt = ReadAsArray('uploads/subtitles.vtt');
var key_words = ReadAsArray('uploads/key_words.vtt');
Time = ExtractTime(vtt);

//--- FUNCTION USING PLAYER VARIABLE---//

/**
        * If user click on help button pause video and display stackoverflow result
        */
function help() {
  player.pause();
  mainCaller();
  console.log('temps : ', player.currentTime());
  SendActivity('click help', player.currentTime() + ';' + new Date().getTime());
}

function updateCurrentTime() {
  currentTime = player.currentTime();
}

/**
        * Check if curruent time is equal to the element of timeHelp at index if equal pause and display stackoverflow result
        *
        */
function checkTime() {
  if (Math.floor(player.currentTime()) == timeHelp[index]) {
    index++;
    player.pause();
    mainCaller();
    console.log('Time reached!');
    SendActivity(
      'crowd help',
      player.currentTime() + ';' + new Date().getTime()
    );
  }
}

/**
        * Update time wantedVTT and keyword to make a query on stackoverflow
        */
function mainCaller() {
  time = player.currentTime();
  wantedVTT = CurrentContent(time, vtt, Time);
  var key_word = Find_Key_Word(wantedVTT);
  ask_stackoverflow('q', 'scala+tail-recursion' + key_word);
}

player.on('pause', function() {
  SendActivity('video pause', player.currentTime());
  time = player.currentTime();
  console.log('pause : ' + time);
  if (configPause) {
    mainCaller();
  }
  seekedback = 1;
});

player.on('play', function() {
  SendActivity('video play', player.currentTime() + ';' + new Date().getTime());
  console.log('play ' + player.currentTime());
});

player.on('seeked', function() {
  time = player.currentTime();
  if (currentTime < time || Math.abs(currentTime - time) < 2) {
    seekedback = 0;
    console.log('seekback NO', currentTime - time);
    //SendActivity(player.currentTime(), '4');
  } else {
    SendActivity(
      'video seek',
      player.currentTime() + ';' + new Date().getTime()
    );
    seekedback = 1;
    mainCaller();
    console.log('seekback YES');
  }
  console.log('seeked ' + time);
});

// This function call the stackexchange API and return the matching id of answers and display it as Overlay
function ask_stackoverflow(type = 'q', query = '', tag = '', body = '') {
  var url = 'https://api.stackexchange.com/2.2/search/';
  timeDisplay = player.currentTime();
  switch (type) {
    //Switch to chose the mode of query stactoverflow
    case 'q':
      url +=
        'excerpts?order=desc&sort=relevance&q=' + query + '&site=stackoverflow';
      break;
    case 'o':
      break;
    default:
  }
  var res = fetch(url)
    .then(function(response) {
      if (response.ok) {
        return response.json();
      }
    })
    .then(function(rJsn) {
      for (i = 0; i < rJsn.items.length; i++) {
        var item = rJsn.items[i];
        var id = item.question_id;
        var title = item.title;
        if (i < 5) {
          ChangeOverlay(i + 1, baseURL + id, title);
        }
      }
      player.currentTime(timeDisplay - 0.001);
      player.overlay({
        overlays: overlay
      });
      player.currentTime(timeDisplay);
    });
}