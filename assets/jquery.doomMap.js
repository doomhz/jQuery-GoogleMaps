/**
* Doom Google Map Plugin
*
* A Google Map Plugin for jQuery.
*
* @author Dumitru Glavan
* @version 1.2
* @requires jQuery v1.4.2 or later
* @requires Google Maps V3
*
* Examples and documentation at: https://github.com/doomhz/jQuery-GoogleMaps
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
					   markerCluster: null,
                       map: null,
                       mapOptions:{
                          zoom: 5,
                          center: null,
                          mapTypeId: 'TERRAIN'
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
		this.config.mapOptions.mapTypeId = this.config.mapOptions.mapTypeId || 'TERRAIN';
        this.config.mapOptions.mapTypeId = google.maps.MapTypeId[self.config.mapOptions.mapTypeId];

        var _map = self.config.map = new google.maps.Map(document.getElementById($self.attr('id')), self.config.mapOptions);

        var infoWindowText = '<div id="info-window"><h1 class="title">{nr}. {title}</h1><div class="content"><p class="description">{desc}</p><p class="read-more">{articolLink}{linkSeparator}{photoLink}</p></div></div>';
        var photoLinkText = '<a href="{link}">Photo album</a>';
        var articolLinkText = '<a href="{link}">Read article</a>';
        var tripCoordinates = [];

		if (self.config.locations) {
			$.each(this.config.locations, function (index, data) {
				tripCoordinates.push(new google.maps.LatLng(data.lat, data.lng));

				var window = self.addInfoWindow({
					content: infoWindowText.replace('{title}', data.title).replace('{desc}', data.desc).replace('{articolLink}', (data.url.length ? articolLinkText.replace('{link}', data.url) : '')).replace('{nr}', data.no).replace('{photoLink}', (data.url_poze.length ? photoLinkText.replace('{link}', data.url_poze) : '')).replace('{linkSeparator}', (data.url.length && data.url_poze.length ? ' | ' : ''))
				})

				self.addMarker({
					lat: data.lat,
					lng: data.lng,
					title: data.no,
					icon: (data.no == self.config.startLocation ? self.config.currentDotMarker.replace('{nr}', data.no) : new google.maps.MarkerImage(self.config.normalDotMarker, null, null, {x:6.4, y:6})),
					events: {
						'click': function(marker) {
							this.closeInfoWindows();
							window.open(this.config.map, marker);
						}
					}
				});

			});
		}

		if (tripCoordinates.length) {
			var tripPath = new google.maps.Polyline({
				path: tripCoordinates,
				strokeColor: "#FF0000",
				strokeOpacity: 1.0,
				strokeWeight: 2
			});

			tripPath.setMap(_map);
		}

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
    },

	$.fn.addMarker = function (options) {
		var config = $.extend({
			lat: false,
			lng: false,
			title: '',
			icon: '',
			events: {
			}
		}, options);
		var self = this;
		var _map = $(this).data('doomMap');
		var marker = new google.maps.Marker({
			position: new google.maps.LatLng(config.lat, config.lng),
			//map: _map.config.map,
			title: typeof config.title === 'string' ? config.title : false,
			icon: typeof config.icon !== 'undefined' ? config.icon : false
		});
		if (_map.config.markerCluster) {
			_map.config.markerCluster.addMarker(marker);
		} else {
			marker.setMap(_map.config.map);
		}
		_map.config.markers.push(marker);
		if (config.events && !$.isEmptyObject(config.events)) {
			$.each(config.events, function (ev, callback) {
				$.isFunction(callback) && google.maps.event.addListener(marker, ev, function () {callback.call(self, marker)});
			});
		}
		return marker;
	},

	$.fn.addInfoWindow = function (options) {
		var config = $.extend({
			content: ''
		}, options);
		var _map = $(this).data('doomMap');
		var window = new google.maps.InfoWindow({
			content: config.content
		});
		_map.config.infoWindows.push(window);
		return window;
	},

	$.fn.map = function () {
		return $(this).data('doomMap').config.map;
	}

	$.fn.mapConfig = function () {
		return $(this).data('doomMap').config;
	}
})(jQuery);
