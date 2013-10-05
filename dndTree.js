(function(dndTree){
	var indent = 15,
	height = 22,
	duration = 200,
	chart = {},
	vis = {},
	dragging = false,
	startpos = {},
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

	function dragStart (d) {
		startpos = {x: d3.event.sourceEvent.x, y: d3.event.sourceEvent.y};
	}

	function dragEnd (d) {
		if (!dragging) return;
		dragging = false;
		var info = getHoverInfo(this, d3.event);
		// Check if it stays the same
		if (samePosition(d, info)) {
			console.log ('Drag ended and nothing changed');
			cleanDnD ();
			return;
		} else {
			var sib = getSibling(d);
			console.log ("Parent:" + d.parent.id + " New Parent: " + info.parent.id);
			console.log ("Sibling: " + (sib ? sib.id : "Last Node") + " New Sibling: " + (info.sibling ? info.sibling.id : "Last Node"));
		}
		// Remove the element
		//d.parent.children.splice(d.parent.children.indexOf(d),1);
		update (dndTree.root);
		cleanDnD ();
	}

	function samePosition (d, info) {
		if (d.parent.id != info.parent.id) return false;
		var sib = getSibling (d);
		if (!sib && !info.sibling) return true;
		if (info.sibling) {
			if (info.sibling.id == d.id) return true;	
			return sib.id == info.sibling.id;
		}
		return !sib;
		
	}

	function move (d) {
		cleanDnD ();
		if (!dragging) dragging = Math.abs(d3.event.sourceEvent.x - startpos.x) > 5 || Math.abs(d3.event.sourceEvent.y - startpos.y) > 5;
		if (!dragging) return;
		dragging = true;
		// Create the drag element
		var textC = chart.append('div')
			.attr('id', 'dragging')
			.style('left', d3.event.sourceEvent.x + 10 + "px")
			.style('top', d3.event.sourceEvent.y + 10 + "px");
		// Check what should be inside the selection
		if (getSelection(this).size() > 1) {
			textC.insert('span').text("Multiple Selection");
		} else {
			textC.insert('span').text(d.name);
		}
		// Highlight elements that we're hovering
		var info = getHoverInfo(this, d3.event);
		// If we're hovering something
		if (!info.hovered.empty()) {
			info.hovered.classed('hovered', true);
			info.top.append('line')
				.attr('id', 'marker')
				.attr('x2', 100)
				.attr('transform', 
					"translate(" + (3/4*indent + info.depth * indent) + "," + height + ")" );
		}
	}

	function getSelection(draggedElem) {
		if (d3.select(draggedElem).classed('selected') && vis.selectAll('.selected').size() > 1)
			return vis.selectAll('.selected');
		else
			return d3.select(this);
	}

	function getHoverInfo (draggedElem, ev) {
		var hover = getHoveredElement (ev);
		var info = {bottom: hover, top: hover, hovered: hover, depth: 0, recursive: false}
		if (!hover.empty()) {
			var coords = d3.mouse(hover.node());
			// See which element should be on top of the selection
			info.top = coords[1] > height/2 ? hover : d3.select(hover.node().previousSibling);
			if (!info.top.empty()) {
				info.bottom = d3.select(info.top.node().nextSibling);
				var coords = d3.mouse(info.top.node());
				info.depth = coords[0] > 0 ? 
					(coords[0] < indent * 20 ? 0 : 1) : 
					Math.ceil((coords[0] + 5)/ indent)-1;
				var topDepth = info.top.datum().depth;
				var bottomDepth = info.bottom.empty() ? 0 : info.bottom.datum().depth;
				info.depth = Math.max(info.depth, bottomDepth - topDepth);
				// Get the parent node
				info.parent = info.top.datum();
				for (var i = info.depth; i < 1; i++) {
					info.parent = info.parent.parent;
				}
				// Get the placement sibling node
				if (!info.bottom.empty()) {
					info.sibling = info.bottom.datum();
					if (info.sibling.parent != info.parent)
						delete info.sibling;
					// TODO: Check if the drag leads to recursion
					getSelection(draggedElem).forEach(function (d, i) {
				
					});
				}
			}
		}
		return info;
	}

	function getSibling (d) {
		var index = d.parent.children.indexOf(d) + 1;
		if (index < d.parent.children.length) {
			return d.parent.children[index];
		}
		return undefined;
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
		var totalHeight;

		nodes.forEach(function(d, i) {
			d.x = d.depth * indent;
        	d.y = i * height;
        	totalHeight = d.y + height;
		});

		// set the height of the div
		chart.style('height', totalHeight + "px");

		// and the size of the svg
		var width = chart.node().getBoundingClientRect().width;
		vis.style('height', totalHeight).style('width', width);

		// Update the nodes…
		var node = vis.selectAll('g.node')
			.data(nodes, function(d) { return d.id; }).order();

		node.transition()
			.duration(duration)
			.style("opacity", 1);

		// the main group
		var issue = node.enter().insert("g")
			.attr("id", function(d) {return 'i' + d.id;})
			.attr("class", "node")
			.style("opacity", 0)
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";})
			.on("click", toggleSelection);
		
		// Just a rectangle to trap events to the left of the element
		issue.append('rect')
			.attr("x", function (d) {return - d.depth * indent})
			.classed('dropArea', true)
			.attr('height', height)	
			.attr('width',  function(d) {return (d.depth+3/4)*indent});

		issue.append("text")
			.attr("y", height*3/4)
			.classed("arrow", true)
			.on("click", expandCollapse);

		// The issue rectangle
		issue.append('rect')
			.attr("x", indent*3/4)
			.classed('issue', true)
			.attr('height', height)	
			.attr('width',  function(d) {return width - d.depth*indent - 300});

		var issueText = issue.append('g')
			.call(d3.behavior.drag().on("drag", move)
				.on("dragstart", dragStart)
				.on("dragend", dragEnd))
			.append("text")
			.attr("x", indent)
			.attr("y", height*3/4);
				
		issueText.append("tspan")
			.classed("link", true)
			.text(function(d) { return "#" + d.id; })
			.on("click", function(d){window.location = "#" + d.id;});

		issueText.append("tspan")
			.attr("class", "name");


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

	function expandCollapse(d) {
		if (d.children) { d._children = d.children; d.children = null;}
		else { d.children = d._children; d._children = null;}
		update(dndTree.root);
		return false;
	}
})(window.dndTree = window.dndTree || {});
