(function(dndTree){
	var indent = 20,
	duration = 100;
	dndTree.root = {};

	dndTree.renderTree = function (root) {
		dndTree.root = root;
		update (dndTree.root);
	}

	var tree = d3.layout.tree();

	function dragEnd (d) {
		console.log("Drag ended");
		d3.selectAll("#dragging").remove();
		d3.selectAll('.hovered').classed('hovered', false);
	}

	function move (d) {
		// clean olde elements
		d3.selectAll('#dragging').remove();
		d3.selectAll('.hovered').classed('hovered', false);
		// Create the drag element
		var sel = d3.select(this);
		var textC = sel.append('div')
			.attr('id', 'dragging')
			.style('left', d3.event.x + 10 + "px")
			.style('top', d3.event.y + 10 + "px");
		if (sel.classed('selected') && d3.selectAll('.selected')[0].length > 1) {
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
		var elem = document.elementFromPoint(ev.x, ev.y);
		while (elem && elem.className != "node") {
			elem = elem.parentElement;
		}
		return d3.select(elem);
	}

	function update(root) {
		var nodes = tree.nodes(root);

		// Update the nodes…
		var node = d3.select("#chart").selectAll('div.node')
			.data(nodes, function(d) { return d.id; }).order();

		node.transition()
			.duration(duration)
			.style("opacity", 1);

		var issueDiv = node.enter().insert("div")
			.attr("id", function(d) {return d.id;})
			.attr("class", "node")
			.style("padding-left", function(d){return d.depth * indent + "px";})
			.call(d3.behavior.drag().on("drag", move)
				.on("dragend", dragEnd))
			.on("click", toggleSelection);
		
		issueDiv.append("span")
			.classed("arrow", true)
			.on("click", expandCollapse);
		
		issueDiv.append("a")
			.attr("href", function(d){return "#" + d.id;})
			.text(function(d) { return "#" + d.id; });
		
		issueDiv.append("span").attr("class", "name");

		// Update the elements of the tree
		node.select('span.name').text(function(d) { return " " + d.name; });
		node.select("span.arrow").html(getNodeDecorator);

		// Remove deleted notes
		node.exit().remove();
	}

	function toggleSelection () {
		var sel = d3.select(this);
		if (!d3.event.metaKey) {
			d3.selectAll('.selected').classed('selected', false);
		}
		sel.classed("selected", !sel.classed("selected"));
	}

	function getNodeDecorator (d) {
		if (d.children) return "&#9663;"; // Down arrow
		if (d._children) return "&#9657;";  // Right arrow
		return "&nbsp;";
	}

	function expandCollapse(d, e) {
		d3.event.stopPropagation();
		if (d.children) { d._children = d.children; d.children = null;}
		else { d.children = d._children; d._children = null;}
		update(dndTree.root);
		return false;
	}
})(window.dndTree = window.dndTree || {});
