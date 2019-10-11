// Initialize svg function
draw();

// On window resize, remove current chart area and redraw it to fit window.
window.onresize = function() {
    var area = d3.select('svg');

    if (!area.empty()) {
        area.remove();
            draw();
    }
};

// Define default starting axes (xslct, yslct), important to define outside of function, to prevent x and y reset when resizing.
var xslct = 'poverty';
var yslct = 'healthcare';

// Draw the svg
function draw() {

    //Auto get window height and width, to make drawing graph responsive, calc widths and heights used later for scaling, specify margins.
    var s_wdh = window.innerWidth*.8;
    var s_hgt = window.innerHeight*.95;

    var margin = { 
        top: 25,
        bottom: 120,
        left: 100,
        right: 120,
    };

    var width = s_wdh - (margin.left + margin.right);
    var height = s_hgt - (margin.top + margin.bottom);

    //Reformat some annoying html codes without needing to open html. Makes page look nicer
    d3.selectAll('.col-md-9')
        .attr('class','')
        .classed('col', true)
        .classed('mx-auto', true)
    
    d3.selectAll('p')
        .attr('class','col-10')
        .classed('mx-auto', true)

    d3.select('h2')
        .style('text-align','center')
        .style('text-decoration', 'underline')

    var svg = d3.select('#scatter')
        .append('svg')
        .classed('col', true)
        .classed('mx-auto', true)
        .attr('width', s_wdh)
        .attr('height', s_hgt)

    var chart = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Use dictionary arrays to define the all the axes variable for x and y. Used in for loops later for non-repetitive coding
    var pov_lbl, age_lbl, inc_lbl, obs_lbl, smk_lbl, hc_lbl;
    var xaxes = [
        {
            name: 'In Poverty (%)',
            var: pov_lbl, 
            data: 'poverty',
            sym: '%'
        },
        {
            name: 'Age (Median)',
            var: age_lbl, 
            data: 'age',
            sym: 'yrs.'
        },
        {
            name: 'Household Income (Median)',
            var: inc_lbl, 
            data: 'income',
            sym: '$'
        }];

    var yaxes = [
        {
            name: 'Obese (%)',
            var: obs_lbl, 
            data: 'obesity',
            sym: '%'
        },
        {
            name: 'Smokes (%)',
            var: smk_lbl, 
            data: 'smokes',
            sym: '%'
        },
        {
            name: 'No Healthcare (%)',
            var: hc_lbl, 
            data: 'healthcare',
            sym: '%'
        }];

    //Scale the x and y axes to desired heights and widths, note flip the min and max on y axes in domain,
    function xscaler(data, xslct) {
        var xlinear = d3.scaleLinear()
            .domain([d3.min(data, d => d[xslct]) * 0.8,
                d3.max(data, d => d[xslct]) * 1.1 ])
                    .range([0, width]);

        return xlinear;

    };

    function yscaler(data, yslct) {
        var ylinear = d3.scaleLinear()
            .domain([d3.max(data, d => d[yslct]) * 1.1, 
                d3.min(data, d => d[yslct]) * 0.8 ])
                    .range([0, height]);
    
        return ylinear;
    };

    //Redner axes, first detect if inputting x or y axis, then fetch (l)eft or (b)ottom axis (lbaxis), render to axis and return.
    function rndr_axes(newscl, axis, xy) {

        var lbaxis;

        if (xy == 'x') {
            var lbaxis = d3.axisBottom(newscl);
        }
        else { 
            var lbaxis = d3.axisLeft(newscl);
        }    
        
        axis.transition()
            .duration(850)
                .call(lbaxis);

        return axis;
    };

    //Color each point differently. Makes points easier to trach visually, but mostly done just for fun.
    function crayon() {

        var tone = 200;
            var r1 = Math.round(Math.random()*tone)
            var r2 = Math.round(Math.random()*tone)
            var r3 = Math.round(Math.random()*tone)
        
        var color = d3.rgb(r1,r2,r3)
        return color;
    };

    //Transistion circles and states to new axes
    function rndr_grp(group, scale, axis, xy) {

        group.transition()
            .duration(1000)
                .attr(`${xy}`, d => scale(d[axis]))
            //How to be somewhat evil, uncomment the following line and try to follow a singular point as axes change. mwhahaha...
                    // .attr('fill', d => crayon());

        return group;
    };

    //Add tool tips for when hovering over point, uses states and circles so mouse can be over either and result is the same. Otherwise, tip only shows
    // when mouse over circle area but not text area.
    function tooltime(data, circles, states) {

        var data = data;
        var xsym, ysym;
        // If x or y is currency (yes, I know there is no y currency but everything MUST BE DYNAMIC), then change format of tool tip label accordingly.
        // Thus currency is formatted like '$ 5000' rather than '5000 $' but percents are still formatted '5 %'
        var xcur = '', ycur = '';

        for (i = 0; i < xaxes.length; i++) {
        if (xaxes[i].data == xslct) {
        xsym = xaxes[i].sym
            if (xsym == '$') {
                xcur = '$'
                xsym = ''
                }
            }
        };

        for (i = 0; i < yaxes.length; i++) {
        if (yaxes[i].data == yslct) {
        ysym = yaxes[i].sym;
            if (ysym == '$') {
                ycur = '$'
                ysym = ''
                }
            }
        };

    var popout = d3.tip()
        .attr('class', 'd3-tip')
            .offset([40, -60])
                .html(d => `${d.state} <br>${xslct}: ${xcur} ${d[xslct]} ${xsym} <br>${yslct}: ${ycur} ${d[yslct]} ${ysym} `);

        circles.call(popout);
        states.call(popout);

        circles.on('mouseover', data => {
            popout.show(data);
        })
        .on('mouseout', data => {
            popout.hide(data);
        });

        states.on('mouseover', data => {
            popout.show(data);
        })
        .on('mouseout', data => {
        popout.hide(data);
        });

        return circles;
    }

    d3.csv('./assets/data/data.csv').then(function(data, err) {
        if (err) throw err;

        // Get data of each desired column and reformat accordingly.
        data.forEach(d => {
            d.state = d.state;
            d.abbr = d.abbr;
            d.poverty = +d.poverty;
            d.healthcare = +d.healthcare;
            d.income = +d.income;
            d.smokes = +d.smokes;
            d.obesity = +d.obesity;
            d.age = +d.age;
        });

        //Make axes
        var xlinear = xscaler(data, xslct);
        var ylinear = yscaler(data, yslct);

        var xax = chart.append('g')
                .attr('transform', `translate(0, ${height})`)
                    .call(d3.axisBottom(xlinear));

        var yax = chart.append('g').call(d3.axisLeft(ylinear));

        //Make circles and state text labels
        var radius = 10;

        var circles = chart.selectAll('circle')
            .data(data)
            .enter()
            .append('circle')
            .attr('cx', d => xlinear(d[xslct]))
            .attr('cy', d => ylinear(d[yslct]))
            .attr('r', radius)
            .classed('stateCircle', true)
            .attr('fill', d => crayon())
            .attr('opacity','.8')

        // Make states user-select none to prevent highlight cursor when hovering over. Use dy to offset label to center in circle.
        var states = chart.selectAll(null)
            .data(data)
            .enter()
            .append('text')
            .attr('x', d => xlinear(d[xslct]))
            .attr('y', d => ylinear(d[yslct]))
            .attr('dy', '.35em')
            .classed('aText', true)
            .classed('stateText', true)
            .style('font-weight','bold')
            .style('user-select','none')
            .text(d => d.abbr)
        
        //Make axes labels, use for loops and dictionary arrays to make axes labels dynamic. Make sure to set the default x and y selects to active.
        // Use class to append xaxis or yaxis accordinly, so each can be differentiated later using a d3.select.
        var labels = chart.append('g')
            .attr('transform', `translate(${width / 2}, ${height + 20})`);

            for (i = 0; i < xaxes.length; i++) {
            var act = 'inactive'
                if (xslct == xaxes[i].data) {
                    act = 'active'
                }
                // console.log('working x', xaxes[i].name)
                xaxes[i].var = labels.append('text')
                    .attr('x', 0)
                    .attr('y', (i+1)*20)
                    .attr('value', `${xaxes[i].data}`)
                    .classed(`${act}`, true)
                    .classed('xaxis', true)
                    .text(`${xaxes[i].name}`)
            };

            for (i = 0; i < yaxes.length; i++) {
            var act = 'inactive'
                if (yslct == yaxes[i].data) {
                    act = 'active'
                }

                // console.log('working y', yaxes[i].name)
                yaxes[i].var = chart.append('text')
                    .attr('transform', 'rotate(-90)')
                    .attr('x', 0 - (height / 2))
                    .attr('y', (i*23) - margin.left)
                    .attr('value', `${yaxes[i].data}`)
                    .attr('dy', '1em')
                    .classed(`${act}`, true)
                    .classed('yaxis', true)
                    .text(`${yaxes[i].name}`);
            }
        
        //Call tool tips for created chart
        var circles = tooltime(data, circles, states);
        
        //Change xaxis when xaxes label is selected, unless it is equal to the current xslct, then do nothing.
        //Re-scale the axis and re-render the axis, circle, states, and update tool tips to have the relevant data
        //Use another foor loops to change all other x-axes variable to inactive except the one selected, which is now active.
        labels.selectAll('.xaxis')
            .on('click', function() {
            var select = d3.select(this).attr('value');
            if (select !== xslct) {

                xslct = select;
                xlinear = xscaler(data, xslct);
                xax = rndr_axes(xlinear, xax, 'x');

                circles = rndr_grp(circles, xlinear, xslct, 'cx');
                states = rndr_grp(states, xlinear, xslct, 'x')
                circles = tooltime(data, circles, states);
            

            for (i = 0; i < xaxes.length; i++) {
                if (xslct === xaxes[i].data) {
                    xaxes[i].var.classed('active', true).classed('inactive', false);
                }
                else {
                    xaxes[i].var.classed('active', false).classed('inactive', true);
                }
            }

        }
        });


        //Do the samething again except for yaxis
        chart.selectAll('.yaxis')
        .on('click', function() {

        var select = d3.select(this).attr('value');
        if (select !== yslct) {

            yslct = select;
            ylinear = yscaler(data, yslct);
            yax = rndr_axes(ylinear, yax, 'y');

            circles = rndr_grp(circles, ylinear, yslct, 'cy');
            states = rndr_grp(states, ylinear, yslct, 'y')

            circles = tooltime(data, circles, states);
            

            for (i = 0; i < yaxes.length; i++) {
                if (yslct === yaxes[i].data) {
                    yaxes[i].var.classed('active', true).classed('inactive', false);
                }
                else {
                    yaxes[i].var.classed('active', false).classed('inactive', true);
                }
            }
            }
        });

    })
    .catch(function(error) {
        console.log(error);
    });
}