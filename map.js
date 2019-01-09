// Dimensions
var margins = {top:30, bottom:30, left:30, right:30}
var width = 500 - margins.left - margins.right;
var height = 460 - margins.top - margins.bottom;

arrayTest = [10, 12, 4, 8, 10, 2, 0, 10, 20];

// Svg of map
var svg_map = d3.select("#map-top").append("svg")
  .attr("width", width + margins.left + margins.right)
  .attr("height", height + margins.bottom + margins.top)

var g_map = svg_map.append('g')
	.attr("transform", "translate(" + margins.left + "," + margins.top + ")")

var x = d3.scaleLinear()
	.range([0,width]),
    y = d3.scaleLinear()
	.range([height, 0])

// Svg of chart
var svg_chart = d3.select("#chart-bottom").append("svg")
	.attr("width", width + margins.left + margins.right)
	.attr("height", height + margins.bottom + margins.top)

var g_chart = svg_chart.append('g')
	.attr("transform", "translate(" + margins.left + "," + margins.top + ")");

var x_axis = d3.scaleTime()
	.range([0, width])

var x_chart = d3.scaleLinear()
	.range([0, width])

var y_chart = d3.scaleLinear()
	.range([height, 0])

// Axis
var xAxis = d3.axisBottom()
  .scale(x_axis)

var yAxis = d3.axisLeft()
  .scale(y_chart)

// Plot l'axe X
d3.csv('weatherAUS_agg.csv', function(data){
  // Date formats
  var parseDate = d3.timeParse("%Y-%m");
  var displayDate = d3.timeFormat("%Y")

  // Column of dates
  var dates = data.map(function(value,index) { return displayDate(parseDate(value['date_months']));})
	
  // Annees min et max
  x_axis.domain([d3.min(dates), d3.max(dates)])

  // xAxis
  g_chart.append('g')
    .attr('transform', 'translate(0,' + height + ')')
    .attr('class', 'xaxis')
    .call(xAxis)
})

// Colors
var colormap = d3.scaleOrdinal(d3.schemeCategory20)

// Projection : a modifier pour changer la carte (taille, position etc...)
var projection = d3.geoMercator()
.translate([ width/2, height/2 ])
.scale(600)
.center([ 132, -28 ])

// Path
var path = d3.geoPath().projection(projection);

// Load the map
d3.json("aust.json", function(json){
  // Un 'g' pour chaque etat
  var group = g_map.selectAll('.map').data(json.features)
  	.enter().append('g').attr('class', 'map');
  // Un 'path' dans chaque 'g'
  var regions = group.append('path')
  	.attr('d', path)
  	.attr('class', 'area')
})


// Fonction appelée lors d'un changement de variable par les boutons radios
// Appelée au debut avec la variable MinTemp
function changeVariable(v){
  varToPlot = v;
  console.log(varToPlot)
  
  // Supprime l'ancien axe
  d3.selectAll('.yaxis').remove()
  d3.csv('weatherAUS_agg.csv', function(data){

    // Get one variable of all array
    var column = data.map(function(value,index) { return parseFloat(value[varToPlot]);})
		
    // Domaine de la variable
    y_chart.domain([0, d3.max(column)]).nice()
    
    // Rajoute l'axe des y
    g_chart.append('g')
      .attr('transform', 'translate(0,0)')
      .attr('class', 'yaxis')
      .call(yAxis);
    
  })
}
changeVariable('MinTemp');

// Enleve le plot d'une station (une ligne)
function removePlot(Station){
  d3.selectAll('#' + Station).remove()
  d3.selectAll('.' + Station).remove()
}

// Plot chart (appelée lors d'une selection par le brush)
function plotChart(Station, col){
  d3.csv('weatherAUS_agg.csv', function(data){
    
    // Get the data of just one station
		oneStation = []
    data.forEach(function(d){
    	if(d.Location == Station){
        oneStation.push(d)
      }
    })
    lineChart(oneStation, col, Station)
  })
}

// Plot lineChart
function lineChart(array, col, Station){
  // 113 est le nombre de valeur max pour une ville
  x_chart.domain([0, 113])
  
  var line = d3.line()
  	.x(function(d, i){ return x_chart(i)})
  	.y(function(d){ return y_chart(d[varToPlot])})
  
  // Line
  g_chart.selectAll('#' + Station)
  	.data([array]).enter().append("path")
  	.attr('class', 'line')
  	.attr('id', Station)
  	.attr('d', line)
  	.style('stroke', col)
  
  // Text
  g_chart.append('text')
  	.attr('class', Station)
  	.attr('id', 'textChart')
  	.text(Station)
  	.attr('x', x_chart(130))
  	.attr('y', y_chart(array[0][varToPlot]))
  	.style('fill', col)
  
}

// Load cities coordinates
d3.csv('Cities.csv', function(csv){
    csv.forEach(function(d){
      d.Latitude = +d.Latitude
      d.Longitude = +d.Longitude
    })
    
    // Un g pour chaque ville
    gcities = g_map.selectAll('.city')
      .data(csv).enter().append('g')
    	.attr('class', 'city')
    	
    circles = gcities.append('circle')
    	.attr('class', 'non_brushed')
    	.attr('r', 6)
    	.attr('cx', function(d){return projection([d.Longitude, d.Latitude])[0]})
    	.attr('cy', function(d){return projection([d.Longitude, d.Latitude])[1]})
    	.text(function(d){return d.Station})
    	.attr('fill', function(d,i){
      return colormap(i)})
    	/*
    	.on("mouseover", function(d,i){
        return tooltip.style("visibility", "visible")
          .text(function(){return d.Station})
    	})
      .on("mousemove", function(){return tooltip.style("top",
          (d3.event.pageY-10)+"px").style("left",(d3.event.pageX+10)+"px");})
      .on("mouseout", function(){return tooltip.style("visibility","hidden");}); */
  })

// Tooltip pour les villes
var tooltip = d3.select("body")
  .append("div")
  .style("position", "absolute")
  .style("z-index", "10")
  .style("visibility", "hidden")

// Brush
var brush = d3.brush()
.extent([[0, 0], [(width+margins.left), (height+margins.bottom)]])
.on("brush", brushed)
.on("end", brushend);

// Create brush function redraw scatterplot with selection
function brushed() {
  if (d3.event.selection != null){
    
    var selection = d3.event.selection;
    // Position de la selection
    var x0 = selection[0][0],
        y0 = selection[0][1],
        x1 = selection[1][0],
        y1 = selection[1][1];
    
    // Met les cercles de la selection en "brushed" et appelle la fct de plot
    circles.attr('class', function(d,i){
      if(d3.select(this).attr('class', 'non_brushed')){
        console.log(d['Location'])
        var cx = d3.select(this).attr("cx"),
            cy = d3.select(this).attr("cy");
        if(x0 <= cx && cx <= x1 && y0 <= cy && cy <= y1){
          // Call plot function
          plotChart(d.Station, colormap(i))
          return 'brushed'
        } else{
          removePlot(d.Station)
          return 'non_brushed'
        }
      }
    })
  }
}

function brushend() {
  if (!d3.event.selection) {
    svg_map.selectAll('.brushed')
    	.attr('class', function(d){removePlot(d.Station)
  			return 'non_brushed'
  		})
    svg_map.selectAll('circle')
      .transition()
      .duration(1)
      .ease(d3.easeLinear)
      .attr("class", "non_brushed");
  }
 }

// Append the brush in a g object in the map
svg_map.append("g")
	.attr("transform", "translate(" + margins.left + "," + margins.top + ")")
  .attr("class", "x brush")
  .call(brush)  //call the brush function, causing it to create the rectangles
.selectAll("rect") //select all the just-created rectangles
  .attr("y", -6)
  .attr("height", height + 7); //set their height