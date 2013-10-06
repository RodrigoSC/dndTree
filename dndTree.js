var dndTree = function(divId){
	var indent = 15,
	height = 22,
	duration = 200,
	dragging = false,
	startpos = {},
	tree = d3.layout.tree();
	
	var that = this;

	var chart = d3.select(divId);
	chart.selectAll('svg').remove();
	var vis = chart.append('svg');

	function dragEnd (d) {
		if (!dragging) return;
		dragging = false;
		var info = getHoverInfo(d, d3.event);
		cleanDnD ();
		if (info.illegal || samePosition(d, info)) return;
		// Remove the element
		d.parent.children.splice(d.parent.children.indexOf(d),1)
		if (d.parent.children.length == 0) delete d.parent.children;
		// Add in the new position
		if (!info.sibling) {
			if (info.parent.children) {
				info.parent.children.push(d);
			} else {
				info.parent.children=[d];
			}
		} else {
			info.parent.children.splice(info.parent.children.indexOf(info.sibling), 0, d);
		}
		d.parent = info.parent;
		that.update (that.root);
	}

	function samePosition (d, info) {
		if (d.parent.id != info.parent.id) return false;
		var sib = getSibling (d);
		if (!sib && !info.sibling) return true;
		if (info.sibling) {
			if (info.sibling.id == d.id) return true;
			if (!sib) return false;
			return sib.id == info.sibling.id;
		}
		return !sib;
	}

	function move (d) {
		cleanDnD ();
		if (!dragging) dragging = Math.abs(d3.event.sourceEvent.screenX - startpos.x) > 5 || 
									Math.abs(d3.event.sourceEvent.screenY - startpos.y) > 5;
		if (!dragging) return;
		dragging = true;
		// Create the drag element
		var textC = chart.append('div')
			.attr('id', 'dragging')
			.style('left', d3.event.x + d.x + 10 + "px")
			.style('top', d3.event.y + d.y + 10 + "px");
		// Check what should be inside the selection
		textC.insert('span').text(d.name);
		// If we're hovering something
		var info = getHoverInfo(d, d3.event);
		if (!info.hovered.empty()) {
			info.hovered.classed('hovered', true);
			info.top.append('line')
				.attr('id', 'marker')
				.attr('x2', 100)
				.classed('illegal', info.illegal)
				.attr('transform', 
					"translate(" + (3/4*indent + info.depth * indent) + "," + height + ")" );
		}
	}

	function getHoverInfo (d, ev) {
		var hover = getHoveredElement (ev);
		var info = {hovered: hover, depth: 0, illegal: false}
		if (!hover.empty()) {
			var coords = d3.mouse(hover.node());
			// See which element should be on top of the marker
			info.top = coords[1] > height/2 ? hover : d3.select(hover.node().previousSibling);
			if (!info.top.empty()) {
				var bottom = d3.select(info.top.node().nextSibling);
				var coords = d3.mouse(info.top.node());
				info.depth = coords[0] > 0 ? 
					(coords[0] < indent * 15 ? 0 : 1) : 
					Math.ceil((coords[0] + 5)/ indent)-1;
				var topDepth = info.top.datum().depth;
				var bottomDepth = bottom.empty() ? 1 : bottom.datum().depth;
				info.depth = Math.max(info.depth, bottomDepth - topDepth);
				// Get the parent node
				info.parent = info.top.datum();
				for (var i = info.depth; i < 1; i++) {
					info.parent = info.parent.parent;
				}
				// Make sure the dragged node is not in the hierarchy
				var parent = info.parent; 
				while(parent) {
					if (parent.id == d.id)  {
						info.illegal = true;
						break;
					}
					parent = parent.parent;
				}
				// Get the placement sibling node
				if (!bottom.empty()) {
					info.sibling = bottom.datum();
					if (info.sibling.parent != info.parent)
						delete info.sibling;
				}
			}
		} else {
			info.illegal = true;
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

	function innerUpdate(root) {
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
		var line = node.enter().insert("g")
			.attr("id", function(d) {return 'i' + d.id;})
			.attr("class", "node")
			.style("opacity", 0)
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";});
		
		// Just a rectangle to trap events to the left of the element
		line.append('rect')
			.classed('dropArea', true)
			.attr('height', height);

		line.append("text")
			.attr("y", height*3/4)
			.classed("arrow", true)
			.on("click", expandCollapse);

		// The issue rectangle
		var issue =  line.append('g')
			.call(d3.behavior.drag().on("drag", move)
				.on("dragstart", dragStart)
				.on("dragend", dragEnd));

		issue.append('rect')
			.attr("x", indent*3/4)
			.classed('issue', true)
			.attr('height', height);

		var issueText = issue.append("text")
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
		node.select('rect.issue').attr('width',  function(d) {return width - d.depth*indent});
		node.select('rect.dropArea')
			.attr("x", function (d) {return - d.depth * indent})
			.attr('width',  function(d) {return (d.depth+3/4)*indent});
		
		node.transition().duration(duration)
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")";})
			.style("opacity",1);

		// Remove deleted notes
		node.exit().transition().duration(duration).style('opacity', 0).remove();
	}

	function dragStart (d) {
		startpos = {x: d3.event.sourceEvent.screenX, y: d3.event.sourceEvent.screenY};
	}

	function cleanDnD () {
		chart.selectAll('#dragging').remove();
		chart.selectAll('#marker').remove();
		chart.selectAll('.hovered').classed('hovered', false);
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

	this.update = function(root) {
		this.root = root;
		innerUpdate (this.root);
	}
}