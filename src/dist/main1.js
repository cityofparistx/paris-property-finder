//**
//Layer overlays that can be displayed on the map
//**
var historyStateChange = true;

var layer_zoning = L.tileLayer('http://107.170.110.4:3000/Zoning/{z}/{x}/{y}.png', {
    maxZoom: 20,
    minZoom: 12
    });

var layer_landuse = L.tileLayer('http://107.170.110.4:3000/Landuse/{z}/{x}/{y}.png', {
    maxZoom: 20,
    minZoom: 12
    });

var layer_fema = L.tileLayer('http://107.170.110.4:3000/FEMA/{z}/{x}/{y}.png', {
    maxZoom: 20,
    minZoom: 12
    });

var layer_reinvestment = L.tileLayer('http://107.170.110.4:3000/reinvestment_zone/{z}/{x}/{y}.png', {
    maxZoom: 20,
    minZoom: 12,
    "opacity": 0.6
    });

var layer_historicDistrict = L.tileLayer('http://107.170.110.4:3000/Historic_Districts/{z}/{x}/{y}.png', {
    maxZoom: 20,
    minZoom: 12,
    "opacity": 0.6
    });    

var layer_blank = L.geoJson([]);

//**
//Interactive GeoJson Property Layer
//**

var propertyGeoJson = L.geoJson();
var propertyGeoJsonStyle = {
    "color": "#FF0000",
    "weight": 5,
    "opacity": 0.65
};
//**
//Main map instance initiation
//**
    
var map = L.map('map', { 
    center: new L.LatLng(33.66099, -95.556742),
    zoom: 12,
    minZoom: 10,
    inertia: true,
    attributionControl: false,
	zoomAnimation: true,
	fadeAnimation: true
});

//**
//Basemap initialization
//**

var ggl = new L.Google();
map.addLayer(ggl);

var layer_parcels = L.tileLayer('http://107.170.110.4:3000/Parcel/{z}/{x}/{y}.png', {
    maxZoom: 20,
    minZoom: 18
});
layer_parcels.addTo(map);

//**
//Leaflet Layer Controls added to map with visual layers
//**
var layerControls = L.control.layers();
layerControls.addOverlay(layer_blank, "No Overlay");
layerControls.addOverlay(layer_zoning, "Zoning");
layerControls.addOverlay(layer_landuse, "Landuse");
layerControls.addOverlay(layer_fema, "FEMA");
layerControls.addOverlay(layer_reinvestment, "Reinvestment Zone");
layerControls.addOverlay(layer_historicDistrict, "Historic Districts");
layerControls.addTo(map);

//**
//Interactive events to listen for
//**

//
function updateProperty(feature){
    map.removeLayer(propertyGeoJson);
    
    propertyGeoJson = L.geoJson(feature, {
                        style: propertyGeoJsonStyle
                    }).addTo(map);
    //propertyGeoJson._path.setAttribute('class', 'animated');
    
    map.fitBounds(propertyGeoJson.getBounds());

    //historyStateChange = false;
    //History.pushState(null, "Property " + feature.properties.prop_id + " - Paris, Tx Map Beta 2.0", "?parcelid=" + feature.properties.prop_id);
    updatePropertyInfo(feature.properties);
}

function updatePropertyInfo(property){
    // Address fix first
    var address = "";
    if (property.situs_num) { address = address + removeNull(property.situs_num) + ' ' };
    if (property.situs_stre) { address = address + removeNull(property.situs_stre) + ' ' };
    if (property.situs_st_1) { address = address + removeNull(property.situs_st_1) + ' ' };
    if (property.situs_st_2) { address = address + removeNull(property.situs_st_2) };

    injectText = "<div id='data-section'><b>" + property.prop_id + "</b>  -  <a href=http://esearch.lamarcad.org/Property/View/" + property.prop_id + " target=_blank>LamarCAD</a></div>"
    
                + "<div id='data-section'><div id='row'><div id='data-left'><b>Address:</b></div><div id='data-right'>" + address + "</div></div>"
                + "<div id='row'><div id='data-left'><b>Owner:</b></div><div id='data-right'>" + removeNull(property.file_as_na) + "</div></div>"
				+ "<div id='row'><div id='data-left'><b>Owner Address:</b></div><div id='data-right'>" + removeNull(property.addr_line1) + "<br>" + removeNull(property.addr_line2) + "<br>" + removeNull(property.addr_line3) + "</div></div>"
				+ "<div id='row'><div id='data-left'><b>Legal Desc:</b></div><div id='data-right'>" + removeNull(property.legal_desc) + "</div></div></div>"
                
                + "<div id='data-section'><div id='row'><div id='data-left'><b>Market Value:</b></div><div id='data-right'>" + removeNull(property.market) + "</div></div>"
				+ "<div id='row'><div id='data-left'><b>Land Value:</b></div><div id='data-right'>" + removeNull(property.land_val) + "</div></div>"
				+ "<div id='row'><div id='data-left'><b>Improved Value:</b></div><div id='data-right'>" + removeNull(property.imprv_val) + "</div></div></div>"

				+ "<div id='data-section'><div id='row'><div id='data-left'><b>Zoning:</b></div><div id='data-right'>" + property.zoning_t + "</div></div>"
				+ "<div id='row'><div id='data-left'><b>Landuse:</b></div><div id='data-right'>" + property.landuse_t + "</div></div>"
				+ "<div id='row'><div id='data-left'><b>FEMA:</b></div><div id='data-right'>" + property.fema + "</div></div></div>";
                
    document.getElementById('info').innerHTML = injectText;
}

function removeNull(str){
    if (!str) return "";

    return str;
}

//clicking the map displays the selected property information
function onMapClick(e) {
    lat = e.latlng.lat;
    lng = e.latlng.lng;
    searchByLatLng(lat, lng);
    historyStateChange = false;
    History.pushState(null, document.title, "?lat=" + lat + "&lng=" + lng);
}

function searchByLatLng(lat, lng) {
    SQLstring = "http://cityofparistx.cartodb.com/api/v2/sql/?q=SELECT * FROM parcels WHERE ST_Contains(parcels.the_geom, ST_GeomFromText('POINT(" + lng + " " + lat + ")',4326))&callback=?&format=geojson";
    $.getJSON(SQLstring, function(data){
        if (data.features == 0){alert("No property at that location.")}
        updateProperty(data.features[0]);
    }).fail (function(jqXHR, textStatus) { alert(textStatus) });
}

map.on('click', onMapClick);

//searching for a Property ID returns the property information if it exists
function onSearchClick() {
    parcelID = document.getElementById("searchbox").value
    searchByParcelID(parcelID);
    historyStateChange = false;
    History.pushState(null, document.title, "?id=" + parcelID);
}

function searchByParcelID(propertyID){
    SQLstring = "http://cityofparistx.cartodb.com/api/v2/sql/?q=SELECT * FROM parcels WHERE prop_id =" + propertyID + "&callback=?&format=geojson";
    $.getJSON(SQLstring, function(data){
        if (data.features == 0){alert("No property with that ID.")}
        updateProperty(data.features[0]);
    }).fail (function(jqXHR, textStatus) { alert(textStatus) });
}

//**
//Legend Events
//**

var legend = '';

map.on('overlayadd', function(e){
    if (e.name === "Zoning") {
        legend = 'dist/legends/Zoning.png';
        document.getElementById('legend').innerHTML = '<img src="' + legend + '">';
        document.getElementById('legend').style.visibility = "visible";
    } else if (e.name === "Landuse") {
        legend = 'dist/legends/Landuse.png';
        document.getElementById('legend').innerHTML = '<img src="' + legend + '">';
        document.getElementById('legend').style.visibility = "visible";
    } else if (e.name === "FEMA") {
        legend = 'dist/legends/FEMA.png';
        document.getElementById('legend').innerHTML = '<img src="' + legend + '">';
        document.getElementById('legend').style.visibility = "visible";
    } else if (e.name === "Reinvestment Zone") {
        legend = 'dist/legends/ReinvestmentZone.png';
        document.getElementById('legend').innerHTML = '<img src="' + legend + '">';
        document.getElementById('legend').style.visibility = "visible";
    } else if (e.name === "Historic Districts") {
        legend = 'dist/legends/HistoricDistricts.png';
        document.getElementById('legend').innerHTML = '<img src="' + legend + '">';
        document.getElementById('legend').style.visibility = "visible";
    } else {
        legend = '';
        document.getElementById('legend').innerHTML = '';
        document.getElementById('legend').style.visibility = "hidden";
    }
});



//**
//Getting and Setting URL arguments
//**

function getQueryVariable(variable){      
       //var query = window.location.search.substring(1);
       var query = History.getState().url.split("?")[1];
       //alert(History.getState().data[0]);
       
       var vars = query.split("&");
       for (var i=0;i<vars.length;i++) {
               var pair = vars[i].split("=");
               if(pair[0] == variable){return pair[1];}
       }
       return(false);
}

//**
//Document initialization
//**

window.onload = function() {
	document.getElementById("searchbox").focus();
	document.getElementById("searchbox").value = "";
   
    loadByQuery();
    
}

function keyPressListener(e) {
    if (e.keyCode == 13) {
        onSearchClick();
    }
}

function loadByQuery() {
    loadedParcelID = getQueryVariable("id");
    loadedLat = getQueryVariable("lat");
    loadedLng = getQueryVariable("lng");
    if (typeof loadedParcelID === "string") {
        searchByParcelID(loadedParcelID);
    } else if (typeof loadedLat === "string" && typeof loadedLng === "string") {
        searchByLatLng(loadedLat, loadedLng);

    }
    
    document.getElementById("searchbox").value = "";
}

History.Adapter.bind(window,'statechange',function(){

    if(historyStateChange){
        historyStateChange = false;
        loadByQuery();
    }
    historyStateChange = true;
    
});