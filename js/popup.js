var siteURL = {
	"weibo": "http://weibo.com/"
};

$(document).ready(function() {
	console.log("Ready");

	var $panelContainer = $(".panel-container");

	if (localStorage.getItem("unreadStatuses") !== null) {
		var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
		var divs = "";
		for (var i = unreadStatuses.length - 1; i >= 0; i--) {
			var status = unreadStatuses[i].data;
			divs += "<div class='item-wrapper'>" 
				+ "<div class='item-header'>"
				+ "<a href='" + siteURL["weibo"] + "u/" + status.user.id + "' class='item-owner-name' target='_blank'>" 
				+ status.user.screen_name
				+ "</a>" 
				+ "<span class='item-time'>" + weibo_timestamps(new Date(status.created_at)) + "</span>"
				+ "</div>"
				+ "<div class='item-content'>"
				+ "<div class='item-text'>" + status.text + "</div>"
				+ "</div>"
				+ "</div>";
		}
		$panelContainer.append(divs);
	}

});

