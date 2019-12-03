var KNETMAPS = KNETMAPS || {};

KNETMAPS.Menu = function() {

	var iteminfo = KNETMAPS.ItemInfo();
	var container = KNETMAPS.Container();
	var stats = KNETMAPS.Stats();
	var legend = KNETMAPS.ConceptsLegend();
	var generator = KNETMAPS.Generator();

	var my=function() {};
	
 my.onHover = function(thisBtn) {
    $(thisBtn).removeClass('unhover').addClass('hover');
 }

 my.offHover = function(thisBtn) {
	    $(thisBtn).removeClass('hover').addClass('unhover');
 }

 my.popupItemInfo = function() {
	 iteminfo.openItemInfoPane();
	 iteminfo.showItemInfo(this);
 }

   // Go to Help docs.
 my.openKnetHelpPage = function() {
   var helpURL = 'https://github.com/Rothamsted/knetmaps.js/wiki/KnetMaps.js';
   window.open(helpURL, '_blank');
  }

  // Reset: Re-position the network graph.
 my.resetGraph = function() {
   $('#cy').cytoscape('get').reset().fit(); // reset the graph's zooming & panning properties.
  }
  
  // Export the graph as a JSON object in a new Tab and allow users to save it.
 my.exportAsJson = function() {
   var cy= $('#cy').cytoscape('get'); // now we have a global reference to `cy`

   var exportJson= cy.json(); // full graphJSON
   
   var elesToRetain= []; // to streamline content exported in exportJson (graphJSON) & metaJSON (allGraphData).
   cy.$(':visible').forEach(function (ele) { elesToRetain.push(ele.id()); });
   
   // remove hidden nodes/edges metadata from exportJson.
   exportJson.elements.nodes= exportJson.elements.nodes.filter( function( con ) {
	   return elesToRetain.includes(con.data.id); });
   exportJson.elements.edges= exportJson.elements.edges.filter( function( rel ) {
	   return elesToRetain.includes(rel.data.id); });
   
   // remove hidden nodes/edges metadata from metaJSON (allGraphData).
   var metaJSON= allGraphData;
   metaJSON.ondexmetadata.concepts= metaJSON.ondexmetadata.concepts.filter( function( con ) {
	   return elesToRetain.includes(con.id); });
   metaJSON.ondexmetadata.relations= metaJSON.ondexmetadata.relations.filter( function( rel ) {
	   return elesToRetain.includes(rel.id); });
   // remove other redundant metaJSON entries.
   var omit_redundant= ["graphName","numberOfConcepts","numberOfRelations","version"];
   omit_redundant.forEach(function (entry) { delete metaJSON.ondexmetadata[entry]; });
   
   // knetwork response: final graphJSON (in exportJson) & allGraphData (in metaJSON) that KnetMaps needs to re-load & render later.
   var exportedJson= "var graphJSON= "+ JSON.stringify(exportJson) + "; var allGraphData= " + JSON.stringify(metaJSON) +";";

   // use FileSaver.js to save using file downloader (deprecated).
   var kNet_json_Blob= new Blob([exportedJson], {type: 'application/javascript;charset=utf-8'});
   saveAs(kNet_json_Blob, "kNetwork.cyjs.json");
   
   // fetch total node & edge count for the knetwork.
   var totalNodes= cy.$(':visible').nodes().size();
   var totalEdges= cy.$(':visible').edges().size();
   
   // knetwork response JSON with 3 fields.
   var knetSave_response = "{ 'nodes': '"+ totalNodes +"', 'edges': '"+ totalEdges +"', 'network': '"+ exportedJson +"' }";
   // return response
   //console.log("knetSave_response: "+ knetSave_response); // test
  }
  
  // Export the graph as a .png image and allow users to save it.
 my.exportAsImage = function() {
   var cy= $('#cy').cytoscape('get'); // now we have a global reference to `cy`

   // Export as .png image
   var png64= cy.png(); // .setAttribute('crossOrigin', 'anonymous');
   //console.log("Export network PNG as: kNetwork.png");

   // Use IFrame to open png image in a new browser tab
   var cy_width= $('#cy').width();
   var cy_height= $('#cy').height();
   //var knet_iframe_style= "border:1px solid black; top:0px; left:0px; bottom:0px; right:0px; width:"+ cy_width +"; height:"+ cy_height +";";
   var knet_iframe_style= "top:0px; left:0px; bottom:0px; right:0px; width:"+ cy_width +"; height:"+ cy_height +";";
   var knet_iframe = '<iframe src="'+ png64 +'" frameborder="0" style="'+ knet_iframe_style +'" allowfullscreen></iframe>';
   var pngTab= window.open();
   pngTab.document.open();
   pngTab.document.write(knet_iframe);
   pngTab.document.title="kNetwork_png";
   pngTab.document.close();
  }

  // Show all concepts & relations.
 my.showAll = function() {
   var cy= $('#cy').cytoscape('get'); // now we have a global reference to `cy`
   cy.elements().removeClass('HideEle');
   cy.elements().addClass('ShowEle');

   // Relayout the graph.
   my.rerunLayout();

   // Remove shadows around nodes, if any.
   cy.nodes().forEach(function( ele ) {
       iteminfo.removeNodeBlur(ele);
      });

   // Refresh network legend.
   stats.updateKnetStats();
  }
  
  // Re-run the entire graph's layout.
 my.rerunLayout = function(isReloaded) {
   // Get the cytoscape instance as a Javascript object from JQuery.
 //  var cy= $('#cy').cytoscape('get'); // now we have a global reference to `cy`
   var selected_elements= cy.$(':visible'); // get only the visible elements.
   
   // Re-run the graph's layout, but only on the visible elements.
   my.rerunGraphLayout(selected_elements, isReloaded);
   
   // Reset the graph/ viewport.
   my.resetGraph();
  }

  var layouts = KNETMAPS.Layouts();
  
  // Re-run the graph's layout, but only on the visible elements.
  my.rerunGraphLayout = function(eles, isReloaded) {
   var ld_selected= $('#layouts_dropdown').val();
   // Use preset layout for reloading saved knetwork.
   if(isReloaded === false) {
      layouts.setPresetLayout(eles);
	  if(ld_selected === "circle_layout") {
		 layouts.setCircleLayout(eles);
        }
	  else if(ld_selected === "cose_layout") {
		  layouts.setCoseLayout(eles);
         }
	  else if(ld_selected === "coseBilkent_layout") {
		  layouts.setCoseBilkentLayout(eles);
		 }
	  else if(ld_selected === "concentric_layout") {
		  layouts.setConcentricLayout(eles);
		 }
	  else if(ld_selected === "ngraph_force_layout") {
		  layouts.setNgraphForceLayout(eles);
		 }
	 }
  }

  // Update the label font size for all the concepts and relations.
  my.changeLabelFontSize = function(new_size) {
   try {
     var cy= $('#cy').cytoscape('get'); // now we have a global reference to `cy`
     console.log("changeLabelFontSize>> new_size: "+ new_size);
     cy.style().selector('node').css({ 'font-size': new_size }).update();
     cy.style().selector('edge').css({ 'font-size': new_size }).update();
    }
   catch(err) {
          console.log("Error occurred while altering label font size. \n"+"Error Details: "+ err.stack);
         }
  }

  // Show/ Hide labels for concepts and relations.
  my.showHideLabels = function(val) {
   if(val === "Concepts") {
      my.displayConceptLabels();
     }
   else if(val === "Relations") {
	   my.displayRelationLabels();
     }
   else if(val === "Both") {
	   my.displayConRelLabels();
     }
   else if(val === "None") {
	   my.hideConRelLabels();
     }
  }

  // Show node labels.
  my.displayConceptLabels = function() {
   var cy= $('#cy').cytoscape('get'); // reference to `cy`
   cy.nodes().removeClass("LabelOff").addClass("LabelOn");
   cy.edges().removeClass("LabelOn").addClass("LabelOff");
  }

  // Show edge labels.
  my.displayRelationLabels = function() {
   var cy= $('#cy').cytoscape('get'); // reference to `cy`
   cy.nodes().removeClass("LabelOn").addClass("LabelOff");
   cy.edges().removeClass("LabelOff").addClass("LabelOn");
  }

  // Show node & edge labels.
  my.displayConRelLabels = function() {
   var cy= $('#cy').cytoscape('get'); // reference to `cy`
   cy.nodes().removeClass("LabelOff").addClass("LabelOn");
   cy.edges().removeClass("LabelOff").addClass("LabelOn");
  }

  // Show node labels.
  my.hideConRelLabels = function() {
   var cy= $('#cy').cytoscape('get'); // reference to `cy`
   cy.nodes().removeClass("LabelOn").addClass("LabelOff");
   cy.edges().removeClass("LabelOn").addClass("LabelOff");
  }

	// Full screen: Maximize/ Minimize overlay
  my.OnMaximizeClick = function() {
   var cy_target= $('#cy').cytoscape('get');
   var currentEles_jsons= cy_target.elements().jsons();
   var currentStylesheet_json= cy_target.style().json(); //cy_target.style().json();
   if(!$('#knet-maps').hasClass('full_screen')) {
      $('#maximizeOverlay').removeClass('max').addClass('min'); // toggle image
	// Maximize
      $('#knet-maps').addClass('full_screen');

	// reload the network
	container.load_reload_Network(currentEles_jsons, currentStylesheet_json/*, false*/);

      // Show Item Info table
	iteminfo.openItemInfoPane();
     }
     else {
      $('#maximizeOverlay').removeClass('min').addClass('max'); // toggle image
	// Minimize
      $('#knet-maps').removeClass('full_screen');

      // reload the network
	container.load_reload_Network(currentEles_jsons, currentStylesheet_json/*, false*/);

      // Hide Item Info table
	iteminfo.closeItemInfoPane();
   }
}

 // Import a saved network into KnetMaps.
 my.importJson = function() {
   // open file dialog
   $("#openNetworkFile").trigger("click");
  }
  
 // Open selected cyjs JSON file to reload KnetMaps with.
 my.OpenKnetFile = function(event) {
   var selectedFile = event.target.files[0];
   //console.log("reopen network: "+ selectedFile.name);
   
   var reader = new FileReader();
   reader.onload = function(e) {
	   var selectedFileContents = e.target.result;
	//   var selectedFileContents = JSON.parse(e.target.result); // parse as JSON (in future)
	   
	   var extract_contents= selectedFileContents.split("};");
	   
	   var graph_data= extract_contents[0].split("var graphJSON= ")[1] + "}";
	   var eles_jsons= graph_data.substring(graph_data.indexOf('elements')+10,graph_data.indexOf('}]}')+3);
	   //console.log("new eles_jsons= "+ eles_jsons);
	   var eles_styles= graph_data.substring(graph_data.indexOf('}]}')+12,graph_data.indexOf('zoomingEnabled')-2);
	   //console.log("new eles_styles= "+ eles_styles);
	   graphJSON= JSON.parse(eles_jsons); // re-add graphJSON
	   
	   var metaJSON= extract_contents[1].split("var allGraphData= ")[1] + "}";
	   allGraphData= JSON.parse(metaJSON); // re-add metadataJSON for ItemInfo
	   
	   var cy= $('#cy').cytoscape('get'); // now we have a global reference to `cy`
	   var currentStylesheet_json= cy.style().json(); // use loaded eles_styles instead
	   // reload KnetMaps with the new network
	   //eval('generator.initializeNetworkView(graphJSON, allGraphData); generator.blurNodesWithHiddenNeighborhood(); stats.updateKnetStats(); legend.populateConceptLegend();');
	   container.load_reload_Network(graphJSON, /*currentStylesheet_json*/JSON.parse(eles_styles), true);
	   eval('stats.updateKnetStats(); legend.populateConceptLegend();');
	  };
	  
   // start reading selectd file's contents
   reader.readAsText(selectedFile);
  }

  return my;
};
