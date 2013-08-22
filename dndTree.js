// Based on http://bl.ocks.org/mbostock/1093025

(function(dndTree){

	var vis ={};

	dndTree.renderTree = function () {
		vis = d3.select("#chart").append("svg:svg")
		.attr("width", w)
		.attr("height", h)
		.append("svg:g")
		.attr("transform", "translate(20,30)");
		d3.json("flare.json", function(json) {
			json.x0 = 0;
			json.y0 = 0;
			update(root = json);
		});	
	}

	var w = 960,
	h = 800,
	i = 0,
	barHeight = 20,
	barWidth = w * .8,
	duration = 400,
	root;

	var tree = d3.layout.tree()
	.size([h, 100]);

	function dragEnd (d) {
		console.log("Drag ended");
		d3.select(this).attr("class", "node");
	}

	function move (d) {
		console.log("Moving");
		d3.select(this).attr("class", "node dragging");
	}

	function update(source) {
		// Compute the flattened node list. TODO use d3.layout.hierarchy.
		var nodes = tree.nodes(root);

		// Compute the "layout".
		nodes.forEach(function(n, i) {
			n.x = i * barHeight;
		});

		// Update the nodes…
		var node = vis.selectAll("g.node")
			.data(nodes, function(d) { return d.id || (d.id = ++i); });

		var nodeEnter = node.enter().append("svg:g")
			.attr("id", function(d) {return d.id;})
			.attr("class", "node")
			.attr("transform", function(d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
			.style("opacity", 1e-6)
			.call(d3.behavior.drag().on("drag", move)
				.on("dragend", dragEnd))
			.on("click", click);

		// Enter any new nodes at the parent's previous position.
		nodeEnter.append("svg:rect")
			.attr("y", -barHeight / 2)
			.attr("height", barHeight)
			.attr("width", barWidth)
			.style("fill", color);

		nodeEnter.append("svg:text")
			//.attr("dy", 3.5)
			//.attr("dx", 5.5)
			.text(function(d) { return "#" + d.id; });
		
		nodeEnter.append("svg:text")
			//.attr("dy", 3.5)
			//.attr("dx", 5.5)
			.text(function(d) { return " " + d.name; });

		// Transition nodes to their new position.
		nodeEnter.transition()
		.duration(duration)
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
		.style("opacity", 1);

		node.transition()
		.duration(duration)
		.attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
		.style("opacity", 1)
		.select("rect")
		.style("fill", color);

		// Transition exiting nodes to the parent's new position.
		node.exit().transition()
		.duration(duration)
		.attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
		.style("opacity", 1e-6)
		.remove();
	}

// Toggle children on click.
function click(d) {
	if (d3.event.defaultPrevented) return;
	console.log("Clicked");
	if (d.children) {
		d._children = d.children;
		d.children = null;
	} else {
		d.children = d._children;
		d._children = null;
	}
	update(d);
}

function color(d) {
	return d._children ? "#3182bd" : d.children ? "#c6dbef" : "#fd8d3c";
}
})(window.dndTree = window.dndTree || {});