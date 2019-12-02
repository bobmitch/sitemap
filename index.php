<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="UTF-8">
	<meta name="viewport" content="width=device-width, initial-scale=1.0">
	<meta http-equiv="X-UA-Compatible" content="ie=edge">
	<title>Holt Bosse Sitemap Creator</title>
	<link rel="stylesheet" href="sitemap.css">
</head>
<body class='edit_mode'>
	<section id="modal">
		<div id='node_options'>
			<button id='add_child' type="button">Add Child</button>
			<button id='add_sibling' type="button" class="not_root">Add Sibling</button>
			<button id='change_type' type="button" class="not_root">Change Page Type</button>
			<button class="not_root change_type_context engager" data-type="engager">Engager</button>
			<button class="not_root change_type_context router" data-type="router">Router</button>
			<button class="not_root change_type_context informer" data-type="informer">Informer</button>
			<button class="not_root change_type_context collection" data-type="collection">Collection</button>
			<button class="not_root change_type_context functional" data-type="functional">Functional</button>
			<button id='delete' type="button" class='danger not_root'>Delete</button>
		</div>
		<div id="dismiss_modal">X</div>
	</section>
	<section id="navbar">
		<a href='#'>Holt Bosse Sitemap Creator V.0.1</a>
		<a id='toggle_view_edit' class='pull-right' href='#'>View</a>
		<a type="button" class='pull-right' onclick="save_sitemap()">Save</a>
		<select class='pull-right' id="load_select">
			<option disabled value="0">Load Project</option>
			<?php 
			$path = "./saves";
			$files = scandir($path);
			$clean_files = array_diff($files, array('.', '..'));
			//print_r ($files);
			foreach ($clean_files as $filename) {
				$parts = explode('.', $filename);
				$last = array_pop($parts);
				$parts = array(implode('.', $parts), $last);
				echo "<option value='" .$filename . "'>" . $parts[0] . "</option>";
				
				
			}
			?>
		</select>
	</section>

	<aside id="project_details">
		<h1 id="project_title" contenteditable="true">Project Title</h1>
		<p class='edit_note'>Note: Project title is used as the save name.</p>
	</aside>

	<section id="sitemap">
		
	</section>


	<section id="keys">
		<div class='contain'>
			<div class='key engager'>Engager</div>
			<div class='key router'>Router</div>
			<div class='key informer'>Informer</div>
			<div class='key functional'>Functional</div>
			<div class='key collection'>Collection</div>
		</div>
	</section>

	<script src="sitemap.js"></script>
</body>
</html>