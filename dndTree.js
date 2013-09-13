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
		d3.select(this).attr("class", "node");
	}

	function move (d) {
		console.log("Moving");
		d3.select(this).attr("class", "node dragging");
	}

	function update(root) {
		var nodes = tree.nodes(root);

		// Update the nodes…
		var node = d3.select("#chart").selectAll('div.node')
			.data(nodes, function(d) { return d.id; });
		
		node.transition()
			.duration(duration)
			.style("opacity", 1);

		var issueDiv = node.enter().insert("div")
			.attr("id", function(d) {return d.id;})
			.attr("class", "node")
			.style("padding-left", function(d){return d.depth * indent + "px";})
			.style("opacity", 0)
			.call(d3.behavior.drag().on("drag", move)
				.on("dragend", dragEnd))
			.on("click", click);
		
		issueDiv.transition()
			.duration(duration)
			.style("opacity", 1);

		issueDiv.append("span")
			.attr("class", "arrow");
		
		issueDiv.append("a")
			.attr("href", function(d){return "#" + d.id;})
			.text(function(d) { return "#" + d.id; });
		
		issueDiv.append("span").attr("class", "name");

		// Update the elements of the tree
		node.select('span.name').text(function(d) { return " " + d.name; });
		node.select("span.arrow").html(getNodeDecorator);

		// Transition exiting nodes to the parent's new position.
		node.exit().transition()
			.duration(duration)
			.style("opacity", 0)
			.remove();
	}

	function getNodeDecorator (d) {
		if (d.children) return "&#9663;"; 
		if (d._children) return "&#9657;"; 
		return "&nbsp;";
	}

	// Toggle children on click.
	function click(d, e) {
		if (d3.event.defaultPrevented) return;
		// console.log("Clicked");
		if (d.children) {
			d._children = d.children;
			d.children = null;
		} else {
			d.children = d._children;
			d._children = null;
		}
		update(dndTree.root);
	}
})(window.dndTree = window.dndTree || {});