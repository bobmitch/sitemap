<?php
header('Content-type: application/json');
$sitemap_json = stripslashes(file_get_contents("php://input"));
$sitemap_object = json_decode($sitemap_json);

$filename = "saves/" . $sitemap_object->title . ".json";
$response = file_put_contents($filename, $sitemap_json);
if ($response) {
	echo '{"success":1,"msg":"Sitemap saved."}';
}
else {
	echo '{"success":0,"msg":"Sitemap failed to save."}';
}
?>