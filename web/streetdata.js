function LStreetData(url) {
  
  function values(object) {
    var values = [];
    for (key in object) {
      values.push(object[key]);
    }
    return values;
  }

  function allNodesById(osm) {
    var result = {};

    $(osm).children('osm').children('node').each(function(idx, node) {
      result[$(node).attr('id')] = node;
    });

    return result;
  }

  function nodes(allNodes, way) {
    return $(way).find('nd').map(function(idx, nd) {
      var nodeId = $(nd).attr('ref');
      return allNodes[nodeId];
    });
  }

  function wayInfo(allNodes, way) {
    return {
      wayId : $(way).attr('id'),
      nodes : nodes(allNodes, way)
    }
  }

  return {
    // bounds: left/bottom/right/top in lat/lon
    ways: function(bounds, callback, error) {
      var queryUrl = url + '?way[bbox=' + bounds.left + ',' + bounds.bottom + ',' + bounds.right + ',' + bounds.top + '][name=*][highway=*]';
      $.ajax(queryUrl, { dataType: "xml" })
        .done(function(data) {
          // TODO this can probably be formulated more functionally
          var streets = {};
          var allNodes = allNodesById(data);

          $(data).find('way').each(function(idx, way) {
            var name = $(way).find('tag[k="name"]').attr('v');
            if (!streets[name]) {
              streets[name] = {
                "name" : name,
                ways   : [],
              }
            }
            streets[name].ways.push(wayInfo(allNodes, way));
          });

          callback(values(streets));
        })
        .error(error);
    }
  };
}
