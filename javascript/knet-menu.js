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
   //var exportedJson= "var graphJSON= "+ JSON.stringify(exportJson) + "; var allGraphData= " + JSON.stringify(metaJSON) +";";
   
   //var kNet_json_Blob= new Blob([exportedJson], {type: 'application/javascript;charset=utf-8'});
   //saveAs(kNet_json_Blob, knet_name);
   
   var exportedJson= '{"graphJSON":'+ JSON.stringify(exportJson) + ', "allGraphData":' + JSON.stringify(metaJSON) +'}';

   // fetch total node & edge count for the knetwork.
   var totalNodes= cy.$(':visible').nodes().size();
   var totalEdges= cy.$(':visible').edges().size();
   
   // add date & timestamp to export response as well.
   var currentDate= new Date();
   var timestamp= currentDate.getTime(); // timestamp for knetwork filename
   var knet_name= timestamp + "_kNetwork.cyjs.json"; // knetwork name
   
   var dd= String(currentDate.getDate()).padStart(2, '0');
   var mm= String(currentDate.getMonth() + 1).padStart(2, '0'); //January=0
   var yyyy= currentDate.getFullYear();
   currentDate= dd + '-' + mm + '-' + yyyy; // date
   
   /* knetwork response JSON with 5 fields: name, date_created, num_nodes, num_edges & the graph. */
   var knetSave_response= '{"name":"'+ knet_name +'", "date_created":"'+ currentDate +'", "num_nodes":'+ totalNodes +', "num_edges":'+ 
       totalEdges +', "graph":'+ /*JSON.stringify(*/exportedJson/*)*/ +'}';
   
   // use FileSaver.js to save using file downloader (deprecated).
   var kNet_json_Blob= new Blob([/*exportedJson*/knetSave_response], {type: 'application/javascript;charset=utf-8'});
   saveAs(kNet_json_Blob, knet_name);
   
   // return response
  }
  
  // Export the graph as a .png image and allow users to save it.
 my.exportAsImage = function() {
   var cy= $('#cy').cytoscape('get'); // now we have a global reference to `cy`

   // Export as .png image
   var png64 = cy.png({
                       "scale" : 2,
                       }); // .setAttribute('crossOrigin', 'anonymous');
   var cyWidth = ($('#cy').width() * 2), cyHeight = ($('#cy').width() * 2);   
   
   //var knet_iframe_style= "border:1px solid black; top:0px; left:0px; bottom:0px; right:0px; width:"+ cy_width +"; height:"+ cy_height +";";
   var knet_iframe_style= "top:0px; left:0px; bottom:0px; right:0px; width:"+ cyWidth +"; height:"+ cyHeight +";";
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
 my.rerunLayout = function() {
   // Get the cytoscape instance as a Javascript object from JQuery.
 //  var cy= $('#cy').cytoscape('get'); // now we have a global reference to `cy`
   var selected_elements= cy.$(':visible'); // get only the visible elements.
   
   // Re-run the graph's layout, but only on the visible elements.
   my.rerunGraphLayout(selected_elements);
   
   // Reset the graph/ viewport.
   my.resetGraph();
  }

  var layouts = KNETMAPS.Layouts();
  
  // Re-run the graph's layout, but only on the visible elements.
  my.rerunGraphLayout = function(eles) {
   var ld_selected= $('#layouts_dropdown').val();
   // Use preset layout for reloading saved knetwork.
   //layouts.setPresetLayout(eles); // test preset
   
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

  // Update the label font size for all the concepts and relations.
  my.changeLabelFontSize = function(new_size) {
   try {
     var cy= $('#cy').cytoscape('get'); // now we have a global reference to `cy`
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
	container.load_reload_Network(currentEles_jsons, currentStylesheet_json, false);

      // Show Item Info table
	iteminfo.openItemInfoPane();
     }
     else {
      $('#maximizeOverlay').removeClass('min').addClass('max'); // toggle image
	// Minimize
      $('#knet-maps').removeClass('full_screen');

      // reload the network
	container.load_reload_Network(currentEles_jsons, currentStylesheet_json, false);

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
   var selectedFile= event.target.files[0];
   
   var reader= new FileReader();
   reader.onload= function(e) {
	   //var selectedFileContents= e.target.result; // file
	   var selectedFileContents= JSON.parse(e.target.result); // parse as JSON.
	   
	   var graph_data= selectedFileContents.graph.graphJSON;
	   var eles_jsons= selectedFileContents.graph.graphJSON.elements;
	   var eles_styles= selectedFileContents.graph.graphJSON.style;
	   // re-add graphJSON
	   graphJSON= eles_jsons; //JSON.parse(eles_jsons);
	   
	   var metaJSON= selectedFileContents.graph.allGraphData;
	   // re-add metadataJSON for ItemInfo
	   allGraphData= metaJSON; // JSON.parse(metaJSON);
	   
	   var cy= $('#cy').cytoscape('get'); // now we have a global reference to `cy`
	   var currentStylesheet_json= cy.style().json(); // use loaded eles_styles instead
	   // reload KnetMaps with the new network
	   //container.load_reload_Network(graphJSON, /*currentStylesheet_json*/ JSON.parse(eles_styles), true);
	   container.load_reload_Network(graphJSON, eles_styles, true);
	   eval('stats.updateKnetStats(); legend.populateConceptLegend();');
	  };
	  
   // start reading selectd file's contents
   reader.readAsText(selectedFile);
  }

  return my;
};
