function LMap(id) {
  // prevent resizing
  var mapDiv = $('#' + id);
  mapDiv.width(mapDiv.width());
  
  var osmLayer = new OpenLayers.Layer.OSM();
  var solutionLayer = new OpenLayers.Layer.Vector("Current solution");
  var navigationControl = new OpenLayers.Control.Navigation({ dragPanOptions: { enableKinetic: true } });
  var zoomControl = new OpenLayers.Control.Zoom()  
  var map = new OpenLayers.Map({
    div: id,
    layers: [ osmLayer, solutionLayer ],
    controls: [
      new OpenLayers.Control.Attribution(),
      navigationControl,
      zoomControl
    ],
    center: [680000, 6840000],
    zoom: 10 
  }); 

    OpenLayers.Control.Click = OpenLayers.Class(OpenLayers.Control, {
        initialize: function(options) {
                      this.handlerOptions = OpenLayers.Util.extend(
                        { "single" :         true, 
                          "stopDouble" :     true,
                          "pixelTolerance" : 10
                        }, this.defaultHandlerOptions
                      );
                      OpenLayers.Control.prototype.initialize.apply(
                        this, arguments
                      ); 
                      this.handler = new OpenLayers.Handler.Click(
                        this, {
                            'click': this.onClick,
                        }, this.handlerOptions
                      );
        },
        onClick: function(evt) { 
          var pixel = new OpenLayers.Pixel(evt.xy.x, evt.xy.y);
          var lonlat = map.getLonLatFromPixel(pixel); 
          lonlat.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
          var control = this;
          control.deactivate();
          this.callback(lonlat);
        }
      });
      var clickControl = new OpenLayers.Control.Click();
      map.addControl(clickControl);
 

    /*var markers = new OpenLayers.Layer.Markers( "Markers" );
    map.addLayer(markers);
    var size = new OpenLayers.Size(21,25);
    var offset = new OpenLayers.Pixel(-(size.w/2), -size.h);
    var icon = new OpenLayers.Icon('http://www.openlayers.org/dev/img/marker.png', size, offset);*/

  function lonLatFromPixel(bounds) {
      var lowerLeftLonLat = map.getLonLatFromPixel(new OpenLayers.Pixel(
          bounds.left, bounds.bottom));
      var upperRightLonLat = map.getLonLatFromPixel(new OpenLayers.Pixel(
          bounds.right, bounds.top));

      var bounds = new OpenLayers.Bounds(lowerLeftLonLat.lon,
          lowerLeftLonLat.lat, upperRightLonLat.lon, upperRightLonLat.lat);

      bounds.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));

      return bounds;
  }

  function highlightWay(way) {
    var points = [];

    for (var i = 0; i < way.nodes.length; i++) { 
        var node = $(way.nodes[i]);
        var point = new OpenLayers.Geometry.Point(node.attr('lon'), node.attr('lat'));
        point.transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());
        points.push(point);
    }

    var line = new OpenLayers.Geometry.LineString(points)
    solutionLayer.drawFeature(
      new OpenLayers.Feature.Vector(line),
      {
        fillColor: "red",
        strokeWidth: 8,
        strokeColor: "red"
      });
    solutionLayer.display(true);
  }

  function selectBox(callback) {
    var control = new OpenLayers.Control();
    OpenLayers.Util.extend(control, {
      draw: function () {
        // this Handler.Box will intercept the shift-mousedown
        // before Control.MouseDefault gets to see it
        this.box = new OpenLayers.Handler.Box( control,
          { 
            done: function(bounds) { 
                    navigationControl.deactivate();
                    map.removeControl(navigationControl);
                    zoomControl.deactivate();
                    map.removeControl(zoomControl);
                    map.removeControl(control);
                    this.deactivate();
                    callback(lonLatFromPixel(bounds));
                  } 
          },
          { keyMask: OpenLayers.Handler.MOD_SHIFT });
        this.box.activate();
      },
    });
    map.addControl(control);
  }

  function zoomTo(bounds, zoom) {
    var projected = bounds.clone().transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());

    var center = projected.getCenterLonLat();
    if (!zoom) {
      zoom = map.getZoomForExtent(projected);
      console.log('invented zoom level', zoom);
    }

    map.setCenter(center, zoom);
    console.log("Setting center to ", center, " and zooming to ", zoom);
   
    return map.getExtent().transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
  }

  function zoomToLonLat(lonlat, zoomlevel) {
    var center = lonlat.clone().transform(new OpenLayers.Projection("EPSG:4326"), map.getProjectionObject());

    map.setCenter(center, zoomlevel);

    return getCurrentBounds();
  }

  function waitForClick(callback) {
    clickControl.callback = callback;
    clickControl.activate();
  }

  function highlight(ways) {
    for (var i = 0; i < ways.length; i++) {
      highlightWay(ways[i]);
    }
  }

  function getCurrentBounds() {
    var extent = map.getExtent();
    return extent.transform(map.getProjectionObject(), new OpenLayers.Projection("EPSG:4326"));
  }

  // Public API
  return {
    // Allow the user to select a box using shift-click, call a callback with the bounds on success
    selectBox: selectBox,
    // center the map to the middle of the 'bounds' and zoom to the zoom level specified
    zoomTo: zoomTo, 
    zoomToLonLat: zoomToLonLat,
    getZoom: function() { return map.getZoom(); },
    getCurrentBounds: getCurrentBounds,
    clear: function()   { solutionLayer.removeAllFeatures(); },

    highlight: highlight,
    waitForClick: waitForClick,
    getProjectionObject: function() { return map.getProjectionObject(); }
  };
};
