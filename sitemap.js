
var sitemap = document.querySelector('#sitemap');
var modal = document.getElementById('modal');
var last_node = null;
var root_node = {
	parent:null,
	children:null,
	depth:1,
	id:0,
	title:'Home',
	type:'home',
	description:'Welcome!'
}
var node_counter=0;
var supportsTouch = 'ontouchstart' in window;


function get_node(id,node) {
	if (node.id==id) {
		return node;
	}
	if (node.children!==null) {
		found_node = null;
		for (var n=0; n<node.children.length; n++) {
			//console.log('recursive call to get node from node id ',node.id,' call number: ',n);
			found_node = get_node (id, node.children[n]);
			if (found_node !== null) {
				return found_node;
			}
		}
	}
	return null;
}

function get_node_index(node) {
	// return index of node compared to siblings
	// false if not found (should not happen!)
	index = false;
	target_index = false;
	for (n=0; n<node.parent.children.length; n++) {
		if (node.parent.children[n].id == node.id) {
			index = n;
			break;
		}
	}
	return index;
}

function serialize_node(node) {
	// recursive node serializer

	//console.log('Serializing node: ',node);

	// add parent_id as reference
	if (node.type != 'home') {
		// only if not root
		node.parent_id = node.parent.id
	}
	else {
		node.parent_id = -1;
	}

	node_json = JSON.stringify(node,['title','id','type','description','parent_id','depth']) + "," ;

	if (node.children!==null) {
		node.children.forEach(child => {
			node_json += child_json = serialize_node(child) ;
		});
	}
	return node_json;
}



function save_sitemap() {
	sitemap_title = document.getElementById('project_title').innerText;
	if (sitemap_title=='Project Title' || sitemap_title=='') {
		alert('Please give your project a name first!');
		return false;
	}
	sitemap_json = serialize_node(root_node);
	// strip trailing comma and add title property
	clean_sitemap_json = '{"title":"' + sitemap_title + '","sitemap":[' + sitemap_json.slice(0, -1) + "]}";
	// ajax post
	var xhr = new XMLHttpRequest();
	xhr.open("POST", "save_sitemap.php", true);
	xhr.setRequestHeader('Content-Type', 'application/json');
	xhr.send(clean_sitemap_json);
	xhr.addEventListener("load", function(){
		alert('Sitemap saved');
	});
	xhr.addEventListener("error", function(){
		alert('Error saving sitemap');
	});
}


// LOAD SITEMAP

document.getElementById('load_select').addEventListener('change',function(e){
	filename = e.target.value;
	if (filename==0) {
		console.log('No file selected');
	}
	else {
		var xhr = new XMLHttpRequest();
		//alert(filename);
		xhr.open("GET", "saves/" + filename + '?nocache=' + (new Date()).getTime(), true);
		xhr.send();
		xhr.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				var loaded_sitemap = JSON.parse(this.responseText);
				load_sitemap(loaded_sitemap);
			}
		};
	}
});

function load_sitemap(loaded_sitemap) {
	console.log('Loading sitemap:');
	console.log(loaded_sitemap);
	node_counter=0;
	document.getElementById('project_title').innerText = loaded_sitemap.title;
	root_node = null;
	loaded_sitemap.sitemap.forEach(node => {
		// clean up descriptions that are just single-spaced
		if (node.description==' ') {
			node.description='';
		}
		if (node.parent_id==-1) {
			// root node id set to -1 during save procedure
			root_node = node;
			root_node.parent = null;
			node.children=null;
			node.parent=null;
		}
		else {
			node.children=null;
			node.parent=null;
			node.parent = get_node (node.parent_id, root_node);
			//console.log('Inserting new none-root node: ',node);
			if (node.parent.children == null) {
				node.parent.children=[];
			}
			node.parent.children.push(node);
		}
		node_counter++;
	});
	render_sitemap();
}



function render_node(node) {
	// recursively traverse node any children
	// return markup
	draggable='';
	if (!node.parent) {
		root_class =' root ';
		draggable = '  ondrop="drop_handler(event)" ondragover="dragover_handler(event)" ';
	}
	else {
		root_class ='';
		draggable = '  ondrop="drop_handler(event)" ondragover="dragover_handler(event)" draggable="true" ondragstart="dragstart_handler(event)" ';
	}
	child_count = 0;
	
	if (node.children !== null) {
		child_count = node.children.length;
	}

	if (child_count>1) {
		has_children = ' has_multiple_children ';
	}
	else {
		has_children = '';
	}

	if (child_count > (8/node.depth)) {
		many_children = ' many_children ';
	}
	else {
		many_children='';
	}
	show_left='';
	show_right='';
	if (node.parent !== null) {
		index = get_node_index(node);
		if (index == 0) { show_left = ' hide '; }
		if (index+1 == node.parent.children.length) { show_right = ' hide '; }
	}
	let markup = `
	<div class='node_wrap'>
		<div data-node_id=${node.id} class='sitemap_node ${root_class} ${node.type}'>
			
			<div class="node_content_wrap" ${draggable}>
				<span class='node_menu'>☰</span>
				<h1 class='node_title' contenteditable="true">${node.title}</h1>
				<p class='node_description' contenteditable="true">${node.description}</p>
				<div class='edit_only ${root_class} reorder_controls'>
					<div class='reorder_control move_left ${show_left}'>&#11207;</div>
					<div class='reorder_control move_right ${show_right}'>&#11208;</div>
				</div>
			</div>
			
			<div class='children child_count_${child_count} ${many_children} ${has_children}'>
			
	`
	if (node.children !== null) {
		node.children.forEach(child => {
			markup += render_node(child);
		});
	}
	markup += '</div></div></div>';
	return (markup);
}


function render_sitemap() {
	sitemap.innerHTML = render_node(root_node);
}
	

// DRAG AND DROP


function dragstart_handler(ev) {
	ev.dataTransfer.effectAllowed = "move";
	// get node id and set in data transfer
	node_id = ev.target.parentElement.dataset.node_id;
	console.log ('Dragging node id: ',node_id);
	ev.dataTransfer.setData("text/plain", node_id);
}

function dragover_handler(ev) {
	ev.preventDefault();
	// check if dragging over self
	var source_node_id = ev.dataTransfer.getData("text/plain");
	if (ev.target.parentElement.dataset.node_id == source_node_id) {
		ev.dataTransfer.dropEffect = "none"
	}
	else {
		ev.dataTransfer.dropEffect = "move"
	}
}

function drop_handler(ev) {
	ev.preventDefault();
	// Get the id of the target and add the moved element to the target's DOM
	var source_node_id = ev.dataTransfer.getData("text/plain");
	// use closest as event target can be element inside droppable element
	var target_node_id = ev.target.closest('.sitemap_node').dataset.node_id ;

	
	// check target isn't self 
	if (target_node_id == source_node_id) {
		console.error('Cannot drop node on self!');
	}
	else if (!target_node_id) {
		console.error('Target node ID not found for target:');
		console.log(ev.target);
	}
	else {
		// change parent of source_node_id to target
		// and add source_node to children of new parent
		target_node = get_node (target_node_id, root_node);
		source_node = get_node (source_node_id, root_node);

		/* console.log('source node:');
		console.log(source_node);
		console.log('target node:');
		console.log(target_node); */

		delete_node_id(source_node); // removes from parents children array
		// switch references
		source_node.parent = target_node;
		if (target_node.children==null) {
			target_node.children=[];
		}
		target_node.children.push(source_node);
		// re-render tree
		render_sitemap();
	}
}



// END DRAG AND DROP



function show_hide_modal_buttons(node){
	// only show delete / change_type for none-root nodes
	//console.log('Checking buttons to show for node: ',node);
	if (node.parent == null) {
		document.getElementById('delete').style.display = "none";
		document.getElementById('change_type').style.display = "none";
		document.getElementById('add_sibling').style.display = "none";
		document.getElementById('add_child').style.display = "block";
	}
	else {
		document.getElementById('delete').style.display = "block";
		document.getElementById('change_type').style.display = "block";
		document.getElementById('add_sibling').style.display = "block";
		document.getElementById('add_child').style.display = "block";
	}
	// always hide page type by default
	type_buttons = document.querySelectorAll('.change_type_context');
	type_buttons.forEach(button => {
		button.style.display = 'none';
	});
}

// VIEW / EDIT SWITCH
toggle_link = document.getElementById('toggle_view_edit');
toggle_link.addEventListener('click',function(e){
	e.preventDefault();
	mode = e.target.innerText;
	document.querySelector('body').classList.toggle('edit_mode');
	editable_elements = document.querySelectorAll('.sitemap_node .node_title, .sitemap_node .node_description');
	if (mode=='Edit') {
		e.target.innerText = 'View';
		editable_elements.forEach(editable => {
			editable.setAttribute('contenteditable','true');
		});
	}
	else {
		e.target.innerText = 'Edit';
		editable_elements.forEach(editable => {
			editable.removeAttribute('contenteditable');
		});
	}
});

// SITEMAP CLICK EVENT HANDLER (dynamic nodes)
sitemap.addEventListener('click',function(e){
	// node menu click
	if (e.target.classList.contains('node_menu')) {
		id = parseInt(e.target.closest('.sitemap_node').dataset.node_id);
		last_node = get_node (id, root_node);
		if (last_node == null) {
			console.log('Node not found: ',id);
		}
		// get position if no touch and put menu contextually next to click position
		if (!supportsTouch) {
			node_options = document.getElementById('node_options');
			node_options.style.left = e.clientX.toString() + 'px';
			node_options.style.top = (e.clientY-100).toString() + 'px';
		}
		show_hide_modal_buttons(last_node);
		modal.classList.toggle('active');
	}
	if (e.target.classList.contains('reorder_control')) {
		id = parseInt(e.target.closest('.sitemap_node').dataset.node_id);
		last_node = get_node (id, root_node);
		index = get_node_index(last_node);
		target_index = false;
		/* 
		for (n=0; n<last_node.parent.children.length; n++) {
			if (last_node.parent.children[n].id == last_node.id) {
				index = n;
				break;
			}
		} */
		if (index===false) {
			console.error('Unable to find node in parent->children array');
			return false;
		}
		if (e.target.classList.contains('move_left')) {
			if (index==0) {
				console.log('Cannot move further left!');
				return false;
			}
			target_index = index-1;
		}
		else {
			if (index+1 >= last_node.parent.children.length) {
				console.log('Cannot move futher right!');
				return false;
			}
			target_index = index+1;
		}
		// swap
		temp_node = last_node.parent.children[target_index];
		last_node.parent.children[target_index] = last_node;
		last_node.parent.children[index] = temp_node;
		render_sitemap();
	}
});



// UPDATE EDITABLE FIELD IN MODEL ON CHANGE 
sitemap.addEventListener('input',function(e){
	if (e.target.classList.contains('node_title') || e.target.classList.contains('node_description')) {
		// find node (using id of containers node_id data attribute)
		closest_node_container = e.target.closest('.sitemap_node');
		//closest_node_container.style.border ='5px solid red';
		id = parseInt(closest_node_container.dataset.node_id);
		console.log('Editing node id: ',id);
		node = get_node (id, root_node);
		console.log('Node: ',node);
		if (node) {
			// update model with info from markup
			if (e.target.classList.contains('node_title')) {
				node.title = e.target.textContent;
			}
			else {
				node.description = e.target.textContent;
			}
			//node.title = e.target.innerHTML; // preserve whitespace, but potentially unsafe if not handled well
			//render_sitemap();
		}
		else {
			console.error('Node ',id,' not found.');
			return false;
		}
	}
});

// DELETE

function delete_node_id(node) {
	index = get_node_index(node);
	/* index = false;
	for (n=0; n < node.parent.children.length; n++) {
		if (node.parent.children[n].id == node.id) {
			index = n;
			break;
		}
	} */
	if (index===false) {
		console.error('Unable to find node in parent->children array');
	}
	else {
		node.parent.children.splice(index,1);
	}
}

document.getElementById('delete').addEventListener('click',function(){
	// find index of node in parents child array
	result = window.confirm('Are you sure you wish to delete this node? Cannot be undone.');
	if (result) {
		index = false;
		for (n=0; n<last_node.parent.children.length; n++) {
			if (last_node.parent.children[n].id == last_node.id) {
				index = n;
				break;
			}
		}
		if (index===false) {
			console.error('Unable to find node in parent->children array');
		}
		else {
			last_node.parent.children.splice(index,1);
			last_node = null;
		}
		render_sitemap();
	}
	modal.classList.toggle('active');
});


// DISMISS MODAL
modal.addEventListener('click',function(e){
	if (e.target.id=='dismiss_modal'||e.target.id=='node_options') {
		modal.classList.toggle('active');
		type_buttons = document.querySelectorAll('.change_type_context');
		type_buttons.forEach(button => {
			button.style.display = 'inline-block';
		});
	}
	else if (e.target.classList.contains('change_type_context')) {
		// handle changing node page type
		new_type = e.target.dataset.type;
		last_node.type = new_type;
		render_sitemap();
		modal.classList.toggle('active');
	}
	else if (e.target.id=='modal') {
		// dismiss modal by clicking on nothing
		e.stopPropagation();
		modal.classList.toggle('active');
	}
});


// CHANGE TYPE OPTION
document.getElementById('change_type').addEventListener('click',function(e){
	// TODO - set class of current type on button appropriately
	// hide all buttons
	buttons=document.querySelectorAll('#node_options button');
	buttons.forEach(button => {
		button.style.display = 'none';
	});
	// show type buttons
	type_buttons = document.querySelectorAll('.change_type_context');
	type_buttons.forEach(button => {
		button.style.display = 'inline-block';
	});
});





// ADD CHILD
document.getElementById('add_child').addEventListener('click',function(e){
	// last_node already set by node click event listener
	//console.log(last_node);
	// TODO: change type based on last type made or based on next type in type array. eg: home, engager, router, informer.
	node_counter++;
	new_node = {
		id:node_counter,
		parent:last_node,
		children:null,
		depth:last_node.depth+1,
		title:'New Page',
		type:'engager',
		description:''
	}
	if (last_node.children == null) {
		last_node.children = [];
	}
	last_node.children.push(new_node);
	render_sitemap(); 
	modal.classList.remove('active');
});

document.getElementById('add_sibling').addEventListener('click',function(e){
	// last_node already set by node click event listener
	//console.log(last_node);
	// TODO: change type based on last type made or based on next type in type array. eg: home, engager, router, informer.
	node_counter++;
	new_node = {
		id:node_counter,
		parent:last_node.parent,
		children:null,
		depth:last_node.depth,
		title:'New Page',
		type:'engager',
		description:' '
	}
	last_node.parent.children.push(new_node);
	render_sitemap(); 
	modal.classList.remove('active');
});

// onload
if (!supportsTouch) {
	document.querySelector('body').classList.add('notouch');
}
render_sitemap();