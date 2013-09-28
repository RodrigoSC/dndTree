(function(dndTree){
	var indent = 15,
	height = 22,
	duration = 200,
	chart = {},
	vis = {},
	tree = d3.layout.tree();
	dndTree.root = {};

	dndTree.prepareTree = function (divId) {
		chart = d3.select(divId);
		chart.selectAll('svg').remove();
		vis = chart.append('svg');
	}

	dndTree.update = function (root) {
		dndTree.root = root;
		update (dndTree.root);		
	}

	function dragEnd (d) {
		var nodes = getHoveredNodes(d3.event);
		console.log("Drag ended");
		console.log("Between " + nodes.top.attr('id') + " and " 
			+ nodes.bottom.attr('id') + " depth " + nodes.depth);
		cleanDnD ();
	}

	function move (d) {
		cleanDnD ();
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
		var nodes = getHoveredNodes(d3.event);
		// If we're hovering something
		if (nodes.hovered.node()) {
			nodes.hovered.classed('hovered', true);
			nodes.top.append('line')
				.attr('id', 'marker')
				.attr('x2', 100)
				.attr('transform', 
					"translate(" + (3/4*indent + nodes.depth * indent) + "," + height + ")" );
		}
	}

	function getHoveredNodes (ev) {
		var hover = getHoveredElement (ev);
		var nodes = {bottom: hover, top: hover, hovered: hover, depth: 0}
		if (hover.node()) {
			var coords = d3.mouse(hover.node());
			nodes.top = coords[1] > height/2 ? hover : d3.select(hover.node().previousSibling);
			nodes.bottom = d3.select(nodes.top.node().nextSibling);
			var coords = d3.mouse(nodes.top.node());
			nodes.depth = coords[0] > 0 ? 0 : Math.ceil((coords[0] + 5)/ indent)-1;
			var topDepth = nodes.top.datum().depth;
			var bottomDepth = nodes.bottom.datum().depth;
			nodes.depth = Math.max(nodes.depth, bottomDepth - topDepth);
			
		}
		return nodes;
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
		var totalHeight;

		nodes.forEach(function(d, i) {
			d.x = d.depth * indent;
        	d.y = i * height;
        	totalHeight = d.y + height;
		});

		// set the height of the div
		chart.style('height', totalHeight + "px");

		// Update the nodes…
		var node = vis.selectAll('g.node')
			.data(nodes, function(d) { return d.id; }).order();

		node.transition()
			.duration(duration)
			.style("opacity", 1);

		var issue = node.enter().insert("g")
			.attr("id", function(d) {return 'i' + d.id;})
			.attr("class", "node")
			.style("opacity", 0)
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";})
			.call(d3.behavior.drag().on("drag", move)
				.on("dragend", dragEnd))
			.on("click", toggleSelection);
		
		issue.append('rect')
			.attr("x", function (d) {return - d.depth * indent})
			.classed('dropArea', true)
			.attr('height', height)	
			.attr('width',  function(d) {return (d.depth+3/4)*indent});

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

	function cleanDnD () {
		chart.selectAll('#dragging').remove();
		chart.selectAll('#marker').remove();
		chart.selectAll('.hovered').classed('hovered', false);
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
