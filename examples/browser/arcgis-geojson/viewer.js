/*globals counties*/

require([
  "dojo/query",
  "esri/map",
  "esri/geometry",
  "esri/graphic",
  "esri/symbols/SimpleLineSymbol",
  "esri/symbols/SimpleFillSymbol",
  "esri/geometry/jsonUtils"
], function (query, Map, Geometry, Graphic, SimpleLineSymbol, SimpleFillSymbol, JsonUtils) {

  var map = new Map("map", {
    basemap: "gray",
    center: [-98, 38],
    zoom: 4
  });

  // create a GeoStore
  var CountyGeoStore = new Terraformer.GeoStore({
    store: new Terraformer.GeoStore.Memory(),
    index: new Terraformer.RTree()
  });
  

  // wait for the load event
  map.on('load', function () {
    // loop over counties
    for (var i = counties.length - 1; i >= 0; i--) {
      var county = counties[i];

      // insert into the index
      CountyGeoStore.add(county);

      // convert for display to an arcgis object
      var arcgis = Terraformer.ArcGIS.convert(county);

      // convert to an esri geometry
      var geometry = JsonUtils.fromJson(arcgis.geometry);

      // make a new graphic for the map
      var gfx = new Graphic(geometry, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
        new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
        new dojo.Color([100,155,55]),1), new dojo.Color([155,255,100,0.35])));

      // add the graphic to the map
      map.graphics.add(gfx);
    }
  });

  function findMe() {
    // One-shot position request.
    navigator.geolocation.getCurrentPosition(function (position) {
      var lat = position.coords.latitude;
      var lng = position.coords.longitude;
      // Query location
      var def = CountyGeoStore.contains({
        type: "Point",
        //coordinates: [ -122.61923540493, 45.533841334631 ]
        coordinates: [ lng, lat ]
      },function(err,results){
        if (results.length) {
          query("#whereami")[0].innerHTML = "You are at " + lng.toFixed(5) + " longitude, " + lat.toFixed(5) + " latitude, in " + results[0].properties.name + " county.";

          // add highlighted county graphic to map, center and zoom
          var arcgis = Terraformer.ArcGIS.convert(results[0]);
          var geometry = JsonUtils.fromJson(arcgis.geometry);

          var gfx = new Graphic(geometry, new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID,
            new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
            new dojo.Color([255,155,55]),2), new dojo.Color([255,155,100,0.45])));

          map.graphics.add(gfx);
          map.setExtent(geometry.getExtent(), true);
        } else {
          query("#whereami")[0].innerHTML = "We couldn't find where you were. Or you aren't in a country right now.";
        }
      });
    });
  }

  query("#submit").on("click", findMe);
});