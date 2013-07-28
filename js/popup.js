var siteURL = {
	"weibo": "http://weibo.com/"
};

$(document).ready(function() {
	console.log("Ready");

	if (localStorage.getItem("unreadStatuses") !== null && localStorage.getItem("unreadStatuses") !== "{}") {		
		var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
		var targets = $.evalJSON(localStorage.getItem("targets"));

		var isFirstKey = true;
		var $navTabs = $(".nav-tabs");
		var $tabContent = $(".tab-content");

		for (var key in unreadStatuses) {
			var target = targets[key];
			$navTabs.append(
				"<li class='" + (isFirstKey ? "active" : "") + "'>" 
				+ "<a href='#t" + key + "' data-toggle='tab'>" + target["mark"] + "</a>" 
				+ "</li>"
			);

			$tabContent.append(
				"<div class='tab-pane" + (isFirstKey ? " active" : "") + "' id='t" + key + "'></div>"
			);

			var targetStatuses = unreadStatuses[key];
			var panes = "";
			for (var i = targetStatuses.length - 1; i >= 0; i--) {
				var status = targetStatuses[i].data;
				panes += "<div class='item-wrapper'>" 
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
			$("#t"+key).append(panes);

			isFirstKey = false;
		}

	} else {

	}


});

