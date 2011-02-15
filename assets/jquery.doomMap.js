/**
* Doom Google Map Plugin
*
* A Google Map Plugin for jQuery.
*
* @author Dumitru Glavan
* @version 1.0
* @requires jQuery v1.4.2 or later
* @requires Google Maps V3
*
* Examples and documentation at: https://github.com/doomhz/jQuery-GoogleMap
* Dual licensed under the MIT and GPL licenses:
*   http://www.opensource.org/licenses/mit-license.php
*   http://www.gnu.org/licenses/gpl.html
*
*/
;(function ($) {
	$.fn.doomMap = function (options) {
		this.config = {locations: null,
                       startLocation: null,
                       currentDotMarker: null,
                       normalDotMarker: null,
                       markers: [],
                       infoWindows: [],
                       map: null,
                       mapOptions:{
                          zoom: 5,
                          center: null,
                          mapTypeId: null
                       },
                       afterLoad: null,
                       onDrag: null
					  };
		$.extend(this.config, options);

		var self = this;
		var $self = $(this);

        var mapCenterLat = '49.24535683689393';
        var mapCenterLng = '25.576156249999986';

		if (self.config.mapOptions.center && typeof self.config.mapOptions.center === 'object') {
			mapCenterLat = self.config.mapOptions.center.lat;
			mapCenterLng = self.config.mapOptions.center.lng;
		} else if (self.config.startLocation.length && typeof self.config.locations[self.config.startLocation - 1] === 'object') {
            mapCenterLat = self.config.locations[self.config.startLocation - 1].lat;
            mapCenterLng = self.config.locations[self.config.startLocation - 1].lng;
        }

        this.config.mapOptions.center = new google.maps.LatLng(mapCenterLat, mapCenterLng);
        this.config.mapOptions.mapTypeId = google.maps.MapTypeId.TERRAIN;

        var _map = self.config.map = new google.maps.Map(document.getElementById($self.attr('id')), self.config.mapOptions);

        var _markers = this.config.markers;
        var _infoWindows = this.config.infoWindows;
        var infoWindowText = '<div id="info-window"><h1 class="title">{nr}. {title}</h1><div class="content"><p class="description">{desc}</p><p class="read-more">{articolLink}{linkSeparator}{photoLink}</p></div></div>';
        var photoLinkText = '<a href="{link}">Photo album</a>';
        var articolLinkText = '<a href="{link}">Read article</a>';
        var tripCoordinates = [];

        $.each(this.config.locations, function (index, data) {
            tripCoordinates.push(new google.maps.LatLng(data.lat, data.lng));

            _markers.push(
                new google.maps.Marker({
                    position: new google.maps.LatLng(data.lat, data.lng),
                    map: _map,
                    title: data.no,
                    icon: (data.no == self.config.startLocation ? self.config.currentDotMarker.replace('{nr}', data.no) : new google.maps.MarkerImage(self.config.normalDotMarker, null, null, {x:6.4, y:6}))
                })
            );

            _infoWindows.push(
                new google.maps.InfoWindow({
                    content: infoWindowText.replace('{title}', data.title).replace('{desc}', data.desc).replace('{articolLink}', (data.url.length ? articolLinkText.replace('{link}', data.url) : '')).replace('{nr}', data.no).replace('{photoLink}', (data.url_poze.length ? photoLinkText.replace('{link}', data.url_poze) : '')).replace('{linkSeparator}', (data.url.length && data.url_poze.length ? ' | ' : ''))
                })
            );

            google.maps.event.addListener(_markers[index], 'click', function() {
                self.closeInfoWindows();
                _infoWindows[index].open(_map, _markers[index]);
            });

        });

        var tripPath = new google.maps.Polyline({
            path: tripCoordinates,
            strokeColor: "#FF0000",
            strokeOpacity: 1.0,
            strokeWeight: 2
        });

        tripPath.setMap(_map);

        (typeof(this.config.afterLoad) === 'function') && this.config.afterLoad.call(this);
        if (typeof(this.config.onDrag) === 'function') {
            google.maps.event.addListener(this.config.map, 'drag', function() {
                self.config.onDrag.call(self);
            });
        }

        $self.data('doomMap', {config:self.config});

		return this;
	},

    $.fn.closeInfoWindows = function () {
        $.each($(this).data('doomMap').config.infoWindows, function (index, win) {
            win.close();
        });
    },

    $.fn.getGeoLocation = function () {
        // Try W3C Geolocation (Preferred)
        var geoLocation = false;
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
              geoLocation = {lat: position.coords.latitude,
                             lng: position.coords.longitude
                            }
            }, function() {
              geoLocation = false;
            });
        // Try Google Gears Geolocation
        } else if (google.gears) {
            var geo = google.gears.factory.create('beta.geolocation');
            geo.getCurrentPosition(function(position) {
              geoLocation = {lat: position.latitude,
                             lng: position.longitude
                            }
            }, function() {
              geoLocation = false;
            });
        }
        return geoLocation;
    }
})(jQuery);
