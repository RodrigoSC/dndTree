(function(dndTree){
	var indent = 15,
	height = 22,
	duration = 200;
	dndTree.root = {},
	chart = {},
	vis = {},
	tree = d3.layout.tree();

	dndTree.prepareTree = function (divId) {
		chart = d3.select("#chart");
		chart.selectAll('svg').remove();
		vis = chart.append('svg');
	}

	dndTree.update = function (root) {
		dndTree.root = root;
		update (dndTree.root);		
	}

	function dragEnd (d) {
		console.log("Drag ended");
		chart.selectAll("#dragging").remove();
		vis.selectAll('.hovered').classed('hovered', false);
	}

	function move (d) {
		// clean old elements
		chart.selectAll('#dragging').remove();
		chart.selectAll('.hovered').classed('hovered', false);
		// Create the drag element
		var textC = chart.append('div')
			.attr('id', 'dragging')
			.style('left', d3.event.x + 10 + "px")
			.style('top', d3.event.y + 10 + "px");
		// Check what should be inside the selection
		if (d3.select(this).classed('selected') && vis.selectAll('.selected')[0].length > 1) {
			textC.insert('span').text("Multiple Selection");
		} else {
			textC.insert('span').text(d.name);
		}
		// Highlight elements that we're hovering
		var hover = getHoveredElement (d3.event);
		console.log(hover);
		hover.classed('hovered', true);
	}

	function getHoveredElement (ev) {
		var elem = document.elementFromPoint(ev.sourceEvent.clientX, ev.sourceEvent.clientY);
		while (elem && !elem.classList.contains('node')) {
			elem = elem.parentElement;
		}
		return d3.select(elem);
	}

	function update(root) {
		var nodes = tree.nodes(root);
		var width = chart.node().getBoundingClientRect().width;

		nodes.forEach(function(d, i) {
			d.x = d.depth * indent;
        	d.y = i * height;
		});

		// Update the nodes…
		var node = vis.selectAll('g.node')
			.data(nodes, function(d) { return d.id; }).order();

		node.transition()
			.duration(duration)
			.style("opacity", 1);

		var issue = node.enter().append("g")
			.attr("id", function(d) {return d.id;})
			.attr("class", "node")
			.style("opacity", 0)
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";})
			.call(d3.behavior.drag().on("drag", move)
				.on("dragend", dragEnd))
			.on("click", toggleSelection);
		
		issue.append('rect')
			.attr("x", indent*3/4)
			.classed('issue', true)
			.attr('height', height)	
			.attr('width',  function(d) {return width - d.depth*indent - 300});
		
		issue.append("text")
			.attr("y", height*3/4)
			.classed("arrow", true)
			.on("click", expandCollapse);

		issue = issue.append("text")
			.attr("x", indent)
			.attr("y", height*3/4);
				
		issue.append("tspan")
			.classed("link", true)
			.text(function(d) { return "#" + d.id; })
			.on("click", function(d){window.location = "#" + d.id;});

		issue.append("tspan").attr("class", "name");


		// Update the elements of the tree
		node.select('tspan.name').transition().duration(duration).text(function(d) { return " " + d.name; });
		node.select('text.arrow').text(getNodeDecorator);
		
		node.transition().duration(duration)
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";})
			.style("opacity",1);

		// Remove deleted notes
		node.exit().transition().duration(duration).style('opacity', 0).remove();
	}

	function toggleSelection () {
		var sel = d3.select(this);
		if (!d3.event.metaKey) {
			d3.selectAll('.selected').classed('selected', false);
		}
		sel.classed("selected", !sel.classed("selected"));
	}

	function getNodeDecorator (d) {
		if (d.children) return "\u25BF"; // Down arrow
		if (d._children) return "\u25B9";  // Right arrow
	}

	function expandCollapse(d, e) {
		d3.event.stopPropagation();
		if (d.children) { d._children = d.children; d.children = null;}
		else { d.children = d._children; d._children = null;}
		update(dndTree.root);
		return false;
	}
})(window.dndTree = window.dndTree || {});
