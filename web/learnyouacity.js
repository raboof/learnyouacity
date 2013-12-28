var allWays; 

// Glue-ing everything together
function learnmeacity() {

  var map = new LMap('map');
  var streetdata = new LStreetData('http://www.overpass-api.de/api/xapi');
  var cityBounds;
  var cityZoom;
  var levelsToUse = 5;
  var levelStep = 2;

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

  function invalidResponseReceived(previousBounds) {
    map.clear();
    showMessage('Failed to locate ' + currentChallenge.name + ', highlighting it.');
    console.log('zooming to', currentLevel);
    map.zoomTo(previousBounds, currentLevel);
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

  function containsChallenge(quadrant) {
    var ways = currentChallenge.ways;
    for (var i = 0; i < ways.length; i++) {
      var way = ways[i];
      for (var j = 0; j < way.nodes.length; j++) { 
        var node = $(way.nodes[j]);
        var lonlat = new OpenLayers.LonLat(node.attr('lon'), node.attr('lat'));
        if (quadrant.containsLonLat(lonlat)) {
          return true;
        }
      }
    }
    return false;
  }

  function getSelectedBounds(lonlat) {
    return map.zoomToLonLat(lonlat, currentLevel+levelStep);
  }

  function receiveResponse(lonlat) {
    var previousBounds = currentBounds;
    var selectedBounds = getSelectedBounds(lonlat);
    if (containsChallenge(selectedBounds))
      validResponseReceived(selectedBounds);
    else
      invalidResponseReceived(previousBounds);
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

  function citySelected(bounds) {
    console.log('City selected, current zoom level is ' + map.getZoom());
    cityBounds = bounds;
    cityZoom = map.getZoom();

    map.zoomTo(bounds, map.getZoom());
    streetdata.ways(bounds, waysSelected, error);
  }

  function startGame() {
    var bounds = map.getCurrentBounds();
    hideButton();
    citySelected(bounds);
  }

  function selectPlayingField() {
    showMessage('Zoom to the region you want to learn');
    showButton('Start Game', startGame);
  }

  selectPlayingField();
}
