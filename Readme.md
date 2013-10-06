#dndTree
##Introduction
`dndTree` is a drag & drop tree built using [D3.js](http://d3js.org/). It was tested in the latest version of [Chrome](http://www.google.com/chrome/‎) and [Firefox](http://www.mozilla.org/en-US/firefox/‎).

It's not exactly brilliant code, but I looked for a D&D tree and couldn't find one, so I made this one publicly available. Feel free to use and tweak, and please [report any issue you find](https://github.com/RodrigoSC/dndTree/issues?state=open).

##Contents
* `dndTree.js` is the actual lib. The code isn't properly done (yet?), so you'll need to edit this file to customize the tree.
* `dndTree.css` are sample styles for the tree. Really ugly right now, but useful for testing.
* `<name>.json` are data files to test the tree. Ignore `issuestable.json` for now, it doesn't work. It will in the future! :)
* `index.html` a simple example

##Usage
To use, just create a `div` with a specific id, and call the constructor. Next, just send your data to the tree. This example assumes you have a `issues.json` file with your tree.

    ...
    <div id="chart"></div>
    ...
    <script type="text/javascript">
        $(function(){
        	var tree = new dndTree("#chart");
        	d3.json("issues.json", function(json) {
				tree.update(json);
			});	
        });
    </script>
    </body>
    </html>
    
###JSON format
The `.json` file needs to have a hierarchical structure. Something like:

    {"id": 1, "name": "Parent", "children": [
      {"id": 2, "name": "Child 1", "children": [
        {"id": 3, "name": "Child 1.1", "children": [
            {"id": 4,"name": "Child 1.1.1"},
            {"id": 5, "name": "Child 1.1.2"}
          ]
        }]
      },
      {"id": 6, "name": "Child 2", "children": [
      	{"id": 7,"name": "Child 2.2"},
      	{"id": 8, "name": "Child 2.3"}
      ]}
    ]}
    
This uses the D3 tree layout, so you can check [more details here](https://github.com/mbostock/d3/wiki/Tree-Layout#wiki-children). 

##Customization
Customization right now isn't a pretty thing… I need to improve that bit!

You'll need to dive into D3 and play with the `innerUpdate` function. Just beware that some of the elements are required for drag and drop to work.