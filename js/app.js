$(function() {

	var FLICKR_API = 'http://api.flickr.com/services/rest/?jsoncallback=?&format=json&api_key=' + FLICKR_API_KEY;

	var App = {};
	App.Collections = {};
	App.Models = {};
	App.Views = {};

	// Simple way to hold what a photo resource should be
	App.Models.FlickrPhoto = Backbone.Model.extend({
		url : function() {
			return _.template( 'http://farm<%= farmId %>.staticflickr.com/<%= serverId %>/<%= id %>_<%= secret %>.jpg', {
				farmId : this.get( 'farm' ),
				serverId : this.get( 'server' ),
				id : this.get( 'id' ),
				secret : this.get( 'secret' )
			});
		}
	});	




	App.Collections.FlickrPhotosForLocation = Backbone.Collection.extend({
		model : App.Models.FlickrPhoto,
		url : function() {
			return 'http://query.yahooapis.com/v1/public/yql?format=json';
		},
		parse : function( response, options ) {
			return response.query.results.photo;
		}
	});


	App.Collections.FlickrPhotosForString = Backbone.Collection.extend({
		model : App.Models.FlickrPhoto,
		url : function() {
			return 'http://query.yahooapis.com/v1/public/yql?format=json';
		},
		parse : function( response, options ) {
			return response.query.results.photo;
		}
	});



	App.Views.FlickrImg = Backbone.View.extend({

		render : function() {

			var attrs = this.model.attributes;
			attrs.src = this.model.url();

			this.$el.html( _.template( $( '#tpl_flickrImg' ).html(), attrs ) );
			return this;
		}

	});





	App.Models.ExpediaHotelInfo = Backbone.Model.extend({
		url : function() {
			return 'http://api.ean.com/ean-services/rs/hotel/v3/info?callback=?&apiKey=' + EXPEDIA_API + '&_type=json';
		},
		parse : function( response, options ) {
			return response.HotelInformationResponse;
		}
	});

	App.Collections.ExpediaHotelList = Backbone.Collection.extend({
		url : function() {
			return 'http://api.ean.com/ean-services/rs/hotel/v3/list?callback=?&apiKey=' + EXPEDIA_API + '&_type=json'
		},
		parse : function( response, options ) {
			return response.HotelListResponse.HotelList.HotelSummary;
		}
	});





	App.Views.ExpediaHotelInfo = Backbone.View.extend({
		render : function() {
			this.$el.html( _.template( $('#tpl_hotelInfo').html(), this.model.attributes ) );
			return this;
		}
	});

	App.Views.ExpediaHotelPopover = Backbone.View.extend({

		events : {
			"click .moreInfo" : "moreInfo",
			"click .photosNearby" : "photosNearby",
			"click .photosByName" : "photosByName" 
		},

		moreInfo : function( e ) {

			var hotelInfo = new App.Models.ExpediaHotelInfo();
			hotelInfo.fetch({
				data : {
					"hotelId" : this.model.get( 'hotelId' )
				},
				success : function( model, response, options ) {
					
					var view = new App.Views.ExpediaHotelInfo({
						model : model
					});
					$('#hotelInfo').html( view.render().el );

				}
			});

			e.preventDefault();
			e.stopPropagation();
		},

		photosNearby : function( e ) {

			var locationPhotos = new App.Collections.FlickrPhotosForLocation();
			locationPhotos.fetch({
				data : {
					"q" : 'select * from flickr.photos.search where has_geo="true" and lat="' + this.model.get('latitude') + '" and lon="' + this.model.get('longitude') + '" and api_key="' + FLICKR_API_KEY + '"'
				},
				success : function( collection, response, options ) {

					$('#hotelInfo').html('');
					collection.each(function( photo ) {
						var view = new App.Views.FlickrImg({
							model : photo
						});

						$('#hotelInfo').append( view.render().el );

					});


				}
			});

			e.preventDefault();
			e.stopPropagation();

		},


		photosByName : function( e ) {

			var locationPhotos = new App.Collections.FlickrPhotosForString();
			locationPhotos.fetch({
				data : {
					"q" : 'select * from flickr.photos.search where text="' + this.model.get('name') + '" and api_key="' + FLICKR_API_KEY + '"'
				},
				success : function( collection, response, options ) {

					$('#hotelInfo').html('');
					collection.each(function( photo ) {
						var view = new App.Views.FlickrImg({
							model : photo
						});

						$('#hotelInfo').append( view.render().el );

					});


				}
			});

			e.preventDefault();
			e.stopPropagation();

		},

		render : function() {
			this.$el.html( _.template( $('#tpl_hotelPop').html(), this.model.attributes ) );
			return this;
		}

	});



	var expediahotelList = new App.Collections.ExpediaHotelList();

	expediahotelList.fetch({
		data : {
			"city" : "London",
			"includeDetails" : true,
			// "numberOfResults" : 5,
			"arrivalDate" : "08/10/2013",
			"departureDate" : "08/17/2013"
		},
		success : function( collection, response, options ) {

			var map = L.map( 'hotelsMap' );
			// add an OpenStreetMap tile layer
			L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
				attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
			}).addTo( map );

			var latLngs = [];

			collection.each(function( hotel ) {

				var view = new App.Views.ExpediaHotelPopover({
					model : hotel
				});

				var popupContent = view.render().el;

				var latLng = [ hotel.get('latitude'), hotel.get('longitude') ];
				var marker = L.marker( latLng ).addTo( map ).bindPopup( popupContent );
				latLngs.push( latLng );
			});

			map.fitBounds( latLngs );
			map.setZoom( 13 );

		}
	});






});