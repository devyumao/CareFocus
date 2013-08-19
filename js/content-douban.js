var doubanCode = window.location.search.split("=")[1];


chrome.extension.sendRequest({key: 'doubanCode', value: doubanCode}, function(response) {
	if (response.data === "ok") {
		$("body").html('授权成功！ <a>关闭页面</a>');
	} else {
		$("body").html('授权失败，请重试。 <a>关闭页面</a>');
	}
	$("a").css({"cursor": "pointer", "color": "#428bca", "text-decoration": "underline"}).click(function() {
		window.close();
	});
});