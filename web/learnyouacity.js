var allWays; 

// Glue-ing everything together
function learnmeacity() {

  var map = new LMap('map');
  var streetdata = new LStreetData('http://www.overpass-api.de/api/xapi');
  var cityBounds;
  var cityZoom;
  var levelsToUse = 5;
  var levelStep = 2;
  // When starting out with a larger map getting the streets will be too slow
  var minimumInitialLevel = 13;

  var maxLevel;
  var currentChallenge;
  var currentLevel;
  var currentBounds;

  function error(foo, bar) {
    alert("Error, perhaps try a smaller region? " + bar);
  }

  function randomElement(obj) {
    return obj[Math.floor(obj.length * Math.random())];
  }

  function invalidResponseReceived() {
    map.clear();
    showMessage('Bummer! You failed to locate ' + currentChallenge.name + ' - here it is!');
    map.highlight(currentChallenge.ways);
    map.waitForClick(newChallenge);
  }

  function showButton(msg, onclick) {
    $('#button')
      .show()
      .text(msg)
      .on('click', onclick);
  }

  function hideButton() {
    $('#button').hide();
  }

  function showMessage(msg) {
    $('#challenge').hide();

    var box = $('#message');
    box.text(msg);
    box.show();
  }

  function validResponseReceived(selectedBounds) {
    currentLevel = currentLevel + levelStep;
    if (currentLevel >= maxLevel) {
      showMessage('Congratulations! Successfully identified ' + currentChallenge.name);
      map.highlight(currentChallenge.ways);
      map.waitForClick(newChallenge);
    } else {
      currentBounds = selectedBounds;
      map.waitForClick(receiveResponse)
    }
  }

  function containsChallenge(selectedArea) {
    var ways = currentChallenge.ways;
    for (var i = 0; i < ways.length; i++) {
      var way = ways[i];
      for (var j = 0; j < way.nodes.length; j++) { 
        var node = $(way.nodes[j]);
        var lonlat = new OpenLayers.LonLat(node.attr('lon'), node.attr('lat'));
        if (selectedArea.containsLonLat(lonlat)) {
          return true;
        }
      }
    }
    return false;
  }

  function receiveResponse(lonlat) {
    // Zoom in and determine bounds of selected area
    var previousBounds = currentBounds;
    map.zoomToLonLat(lonlat, currentLevel+levelStep);
    var selectedBounds = map.getCurrentBounds();

    if (containsChallenge(selectedBounds)) {
      validResponseReceived(selectedBounds);
    } else {
      map.zoomTo(previousBounds, currentLevel);
      invalidResponseReceived();
    }
  }

  function showChallenge(challenge, cityBounds) {
    currentChallenge = challenge;
    currentBounds = map.zoomTo(cityBounds, cityZoom);
    currentLevel = map.getZoom();
    maxLevel = currentLevel + levelsToUse;
    $('#challengeStreetName').text(challenge.name);
    $('#challenge').show();
    $('#message').hide();

    map.clear();
    map.waitForClick(receiveResponse)
  }

  function chooseNextChallenge() {
    return randomElement(allWays);
  }

  function newChallenge() {
    showChallenge(chooseNextChallenge(), cityBounds);
  }

  function waysSelected(ways) {
    allWays = ways;
    newChallenge();
  }

  function citySelected(bounds, zoom) {
    cityBounds = bounds;
    cityZoom = zoom;

    map.removeNavigationControls();
    map.zoomTo(bounds, zoom);
    showMessage("Loading streets, please wait...");
    streetdata.ways(bounds, waysSelected, error);
  }

  function startGame() {
    var bounds = map.getCurrentBounds();
    var zoom = map.getZoom();

    if (zoom < minimumInitialLevel) {
      showMessage("Area too large - please zoom in further");
    } else {
      hideButton();
      citySelected(bounds, zoom);
    }
  }

  function selectPlayingField() {
    showMessage('Please zoom to the region you want to learn');
    showButton('Start Game', startGame);
  }

  selectPlayingField();
}
