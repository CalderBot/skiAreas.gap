// because d3 transform rotate syntax only works in degrees...
function radiansToDegrees(radian) {
	return radian * (180 / Math.PI)
}

function setTimeZone() {
	
	var timeOffset = -8;

	if (timezones.PST.indexOf(currentState) > -1) {
		currentTimeZone = 'PST';
		timeOffset = -8;
	}
	else if (timezones.EST.indexOf(currentState) > -1) {
		currentTimeZone = 'EST'
		timeOffset = -5;
	}
	else if (timezones.MST.indexOf(currentState) > -1) {
		currentTimeZone = 'MST'
		timeOffset = -7;
	}
	else if (timezones.AKST.indexOf(currentState) > -1) {
		currentTimeZone = 'AKST'
		timeOffset = -9;
	}
	else if (timezones.HAST.indexOf(currentState) > -1) {
		currentTimeZone = 'HAST'
		timeOffset = -10;
	}
	else if (timezones.CST.indexOf(currentState) > -1) {
		currentTimeZone = 'CST'
		timeOffset = -6;
	}
	// console.log(currentTimeZone)

	// remove all classes from body (old gradient class)
	$('body').removeClass();

	// use UTC hours so that the offset is correct
	var UTC = new Date().getUTCHours();
	// must never be negative or greater than 24
	$('body').addClass('sky-gradient-' + Math.abs((UTC + timeOffset + 1) % 24));

}
// returns the list of ski areas in a given state:
function selectByState(skiAreaList,state){
	return skiAreaList.filter( function(skiArea){return skiArea.state === state;} )
}

// Fills the drop down list of states
function loadStates(skiAreaList){
	
	// don't fill the list if it already contains stuff
	if ( $('.state-select').children().size() > 0 ) return;

	// append an <option> per state.
	// NOTE: values cannot contain spaces, so we convert them to '-' and then convert them back to spaces later
	for (var i=0, len=skiAreaList.length; i<len; i++) {
		if ($('.state-select').has('option[value="' + skiAreaList[i].state.replace(' ', '-') + '"]').length === 0) {
			$('.state-select').append('<option value=' + skiAreaList[i].state.replace(' ', '-') + '>' + skiAreaList[i].state + '</option>');
		}
	}

	// Alphabetize <option>s
	var sorted = $('.state-select').children().toArray().sort(function(a,b) {
			if ($(a).text() > $(b).text()) { return 1 }
			else if ($(a).text() === $(b).text()) { return 0 }
			else { return -1 }
		})

	$('.state-select').html(sorted)

}


// returns true for ski areas that have enough data for meaningful visualization
function isComplete(area) {
	if (area.expert === undefined) area.expert = 0;
	if (area.advanced === undefined) area.advanced = 0;
	if (area.yearlySnowfall === undefined ) area.yearlySnowfall = 0;
	return ( area.state && area.vertical && area.skiableAcres );
}

function describe(a){
	var str = "vert:"+a.vertical+'ft  ';
	if(a.top) str += "top:"+a.top+'ft  ';
	if(a.yearlySnowfall) str += "snow:"+a.yearlySnowfall+'in  '
	if(a.advanced || a.expert) str += "advanced+:"+(a.advanced+a.expert)+'%  '
	str += "acres:"+a.skiableAcres;
	return str;
}

// Main rendering function
function render(sortby, state) {

	// since render can get called multiple times,
	// empty out the svg each time
	$('.main-svg').remove();

	// sort by awesomeness if no sortby is passed
	var sortby = sortby || 'awesome';

	// get window height so SVG is full-height
	var WINDOWHEIGHT = parseInt(window.innerHeight);

	// Cut out ski ares that don't have enough info for meaningful visualization
	var data = skiAreaList.filter(isComplete)
	
	// console.log("number of areas: ", data.length)
	var selectedState = state || "California"
	data = selectByState(data,selectedState);

	// sort array by snowfall
	if (data.length === 0) alert("no ski areas in this state!");
	else var sortedSnowfall = data.sort(function(a,b) {return a.yearlySnowfall - b.yearlySnowfall; });

	// number value of lowest snowfall is first item in sorted array
	var lowestSnow = sortedSnowfall[0].yearlySnowfall;

	var SNOWCONSTANT = 0.1;

	var makeSnowFall = (function() {
		for (var i=0; i<data.length; i++) {
			data[i].snowfall = new Array(
				Math.floor(
					(data[i].yearlySnowfall - lowestSnow) * (data[i].skiableAcres / data[i].vertical) * SNOWCONSTANT + 1
				)
			)
		}
	})();
	
	function snowflakes(area){

	}

	// awesomeness constants
	var SNOWFALLSCALE = 10
	var EXPERTSCALE = 40
	var ADVANCEDSCALE = EXPERTSCALE
	var ACRESSCALE = 0.8
	var VERTSCALE = 1


	// mountain building & snowflake constants
	var SVG_HEIGHT = WINDOWHEIGHT
	var AWESOMESCALE = 500
	var XSCALE = 200
	var WIDTHSCALE = 200
	var SVG_WIDTH = XSCALE * data.length + 100
	var YHEIGHT = SVG_HEIGHT
	var HEADERHEIGHT = 44
	var HEIGHTSCALE = (YHEIGHT - HEADERHEIGHT) / 4500
	var SNOWBANDWIDTH = 1.5 // how wide the band of snow is on each mountain

	// FUNCTION TO DETERMINE HOW AWESOME EACH MOUNTAIN IS
	//	... normalize numbers using constants
	function makeAwesomeness(skiArea){
	  var n = ACRESSCALE * skiArea.skiableAcres
	  	+ SNOWFALLSCALE * skiArea.yearlySnowfall 
	  	+ EXPERTSCALE * skiArea.expert 
	  	+ ADVANCEDSCALE * skiArea.advanced
	  	+ VERTSCALE * (skiArea.top - skiArea.base)
	  return n / AWESOMESCALE;
	}

	// store `awesomeness` as a value in data array
	// ... awesomeness is a number generated by makeAwesome()
	for (i=0;i<data.length;i++) {
	  data[i].awesomeness = makeAwesomeness(data[i]);
	}

	// sort array by `awesomeness` so mtns are in order
	// ... left to right, by most to least awesome
	if (sortby === 'awesome') {
		data.sort(function(a,b) {
			return b.awesomeness - a.awesomeness;
		})
	}
	else if (sortby === 'snowfall') {
		data.sort(function(a,b) {
			return b.yearlySnowfall - a.yearlySnowfall;
		});
	}
	else if (sortby === 'difficult') {
		data.sort(function(a,b) {
			// console.log(b)
			return (b.advanced + b.expert) - (a.advanced + a.expert);
		})
	}
	else if (sortby === 'skiable acres') {
		data.sort(function(a,b) {
			return b.skiableAcres - a.skiableAcres;
		})
	}

	// SVG points to make triangles
	// ... save to data[i]
	// ... bottom left, bottom right, top center
	for(i=0;i<data.length;i++){
		var width = (2 * data[i].skiableAcres / data[i].vertical) * WIDTHSCALE;
	  data[i].points=[
		  {x: i * XSCALE, y: YHEIGHT },
		  {x: i * XSCALE + width, y: YHEIGHT },
		  {x: i * XSCALE + (width / 2), y: YHEIGHT - data[i].vertical * HEIGHTSCALE }
	  ]
	}

	var svg = d3.select('body')
		.append('svg')
		.attr('class', 'main-svg')
		.attr('width', SVG_WIDTH)
		.attr('height', SVG_HEIGHT)

	// ------------------------ MAKE TRIANGLE MOUNTAINS ------------------------
	var mtns = svg.selectAll('polygon')
		.data(data)
		.enter()
		.append('polygon')
		.attr('points', function(d) {
			return d.points.map(function(item) { 
				// use previously created points array to populate 'points' attribute
				return [item.x,item.y].join(',');
			}).join(' ');
		})
		.attr('fill', function(d) {
			return 'rgba(0, ' + Math.round( (100 - (d.advanced + d.expert)) * 2.55) + ',' + Math.round((d.advanced + d.expert) * 2.55) + ' , .8)'
		});

	// ------------------------ MAKE MOUNTAIN TITLE TEXT ------------------------
	var YSHIFT = (WINDOWHEIGHT-200)/data.length;
	var FONT_SIZE=5
	var text = svg.selectAll('text')
		.data(data)
		.enter()
		.append('text')
		.text(function(d){ return d.name; })
		.on("mouseover", function(){d3.select(this).text( function(d){ return describe( d ); }) })
		.on("mouseout",  function(){d3.select(this).text( function(d){ return d.name; }) })
		.attr('x', function(d, i) {
			var halfwidth = (d.skiableAcres / d.vertical) * WIDTHSCALE;
			return XSCALE * i + Math.max(20,halfwidth - FONT_SIZE*d.name.length)
		})
		.attr('y', function(d) { return YHEIGHT - 8 })
		.attr('font-family', 'Open Sans')
		.style('text-transform', 'uppercase')
		.style('border-bottom', '1px solid #fff')
		.style('letter-spacing', '2px')
		.style('font-size', '13px')
		.attr('fill', '#fff')
		.style('text-anchor', 'start')
		.attr('transform', function(d,i) {
			var halfwidth = (d.skiableAcres / d.vertical) * WIDTHSCALE;
			var height = d.vertical * HEIGHTSCALE;
			var angle = -radiansToDegrees(Math.atan(height / halfwidth));
			var x = Math.round(XSCALE * i)
			var y = YHEIGHT
			return 'rotate(' + angle + ', ' + x + ', ' + y + ')'
		})
	

	// ------------------------ DISPLAY SKI AREA INFO (on hover) ------------------------
	// var infoBox = d3.select('body')
	// 	.selectAll('.info')
	// 	.data(data)
	// 	.enter()
	// 	.append('p')
	// 	.attr('class', 'info')
	// 	.attr('style', function(d, i) {
	// 		// console.log(XSCALE, i)
	// 		return 'left: ' + (XSCALE * i + XSCALE/2) + 'px; top: ' + d.points[2].y + 'px;'
	// 	})
	// 	.html(function(d) {
	// 		// console.log(d)
	// 		return 'Yearly snowfall: ' + d.yearlySnowfall + ' inches<br>Skiable acres: ' + d.skiableAcres 
	// 	})


	// ------------------------ MAKE SNOW FALL! ------------------------
	var interval = 8000;

	if(SNOWING){
		// for each mountain...
		setInterval(function() {
			for (var j=0, len=data.length; j<len; j++) {

					svg.selectAll('.snow')
					.select('.snow')
					.data(data[j].snowfall)
					.enter().append('circle')
					.attr('class', 'snow').attr('fill', 'white')
					.attr('r', function(d) {
						var x = Math.random();
						// radius is usually a random number between 3 and 6
						if (x > 0.02) {
							return Math.round(Math.random()*3+2)
						}
						else if (x > .0005 ) {
							return 7
						}
						else if (x > .000005) {
							return 10
						}
						else return 15
					})
					.attr('cx', function() {
						var width = (2*XSCALE * data[j].skiableAcres)/data[j].vertical;
						var randomWidth = width*(Math.random()+Math.random()+Math.random()+Math.random()+Math.random()+Math.random()-3)/6; 
						var mountainTop = j*XSCALE + width/2; 
						return mountainTop + SNOWBANDWIDTH*randomWidth;
					})
					.attr('cy', '0')
					.style('opacity', function() {
						return Math.random();
					})
					.transition()
					.ease('linear')
					.duration(interval)
					.delay(function(d, i) {
						return i*Math.random() * interval * 1.5 / data[j].snowfall.length
					})
					.style('opacity', '0')
					.attr('cy', function() {
						return 0.9*SVG_HEIGHT
					})
					.each('end', function() {
						this.remove()
					})
			}
		}, interval/2)
	} // <-- end SNOW_ON conditional
} // <-- end render()

var SNOWING = true;
var currentState = 'California';
var currentSortBy = 'awesome';
var currentTimeZone = 'PST';

$(function() {

	render('awesome', 'California');
	
	// ------------------------ PUT LAST .sink LABEL AT FAR RIGHT ------------------------
	var DOCWIDTH = parseInt($(document).width());
	$('.key.sink').width(DOCWIDTH - 450)
	$('.sink.right').css('left', DOCWIDTH - 180 + 'px')

	// ------------------------ FAKE <SELECT> MENUS ------------------------

	// Load up the states drop down with all states that have 'visualizable' ski areas
	loadStates(skiAreaList.filter(isComplete));

	// TODO: merge the two .change functions into one
	$('.sortby').change(function() {
		var sortby = $(this).val();
		var span = $(this).siblings('.js-dropdown-val');
		var selected = $(this).children(':selected');
		var adj = selected.attr('data-adjective');
		var state = $('.state-select').val().replace('-', ' ');
		currentState = state;
		currentSortBy = sortby;
		render(sortby, state)
		$('var').text(sortby)
		span.text(adj);
	});

	$('.state-select').change(function() {
		var state = $(this).val().replace('-', ' ');
		var span = $(this).siblings('.js-dropdown-val');
		var sortby = $('.sortby').val();
		currentState = state;
		currentSortBy = sortby;

		setTimeZone();

		render(sortby, state)
		span.text(state)
	});

	$('.state-select').find('option[value="California"]').prop('selected', true);

	$(window).resize(function() {
		render(currentSortBy, currentState)
	});

	window.onblur = function(){console.log("blurred"); SNOWING=false;render(currentSortBy, currentState);}
	window.onfocus = function(){console.log('focused'); SNOWING=true; render(currentSortBy, currentState);}

	setTimeZone();
});



