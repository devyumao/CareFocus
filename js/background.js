//open -a Google\ Chrome --args -disable-web-security
//iphone客户端：5786724301

var notifAmount;
if (localStorage.getItem("notifAmount") !== null) {
	notifAmount = parseInt(localStorage.getItem("notifAmount")); 	
} else {
	notifAmount = 0;
}

if (localStorage.getItem("unreadStatuses") !== null) {
	var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
} else {
	var unreadStatuses = [];
}

function checkWeiboUpdate(uid) {
	return function() {
		$.ajax({
			url: "https://api.weibo.com/2/statuses/user_timeline.json?source=5786724301&uid="+uid+"&trim_user=0",
			type: "GET",
			dataType: "json",
			success: function(data) {
				console.log(uid + ": " + Date());
				var isStatusesUpdated = false;
				var lastCheckPoint = new Date(localStorage.getItem("checkPoint"));
				if (localStorage.getItem("checkPoint") !== null) {
					for (var i = 0; i < data.statuses.length; i++) {
						var status = data.statuses[i];
						var createdAt = new Date(status.created_at);
						if (createdAt > lastCheckPoint) {
							if(0 === i) {
								localStorage.setItem("checkPoint", status.created_at);	
							}
							unreadStatuses.push({type: "weibo", data: status});
							notifAmount++;
							isStatusesUpdated = true;
						} else {
							break;
						}
					};
				} else if (typeof data.statuses[0] !== "undefined") {
					localStorage.setItem("checkPoint", data.statuses[0].created_at);
				} else {
					localStorage.setItem("checkPoint", new Date());
				}

				if(notifAmount === 0) {
					chrome.browserAction.setBadgeText({text: ""});
				} else {
					chrome.browserAction.setBadgeText({text: "" + notifAmount});
				}

				if (isStatusesUpdated) {
					localStorage.setItem("notifAmount", notifAmount);
					localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));
				}
				
			},
			error: function(data) {
				alert("UserTimeLine Ajax Error");
			}
		});

		setTimeout(checkWeiboUpdate(uid), 5000);
	};
	
}

 
if (localStorage.getItem("targets") !== null) {
	var targets = $.evalJSON(localStorage.getItem("targets"));
	for (var key in targets) {
		checkWeiboUpdate(targets[key]["weibo"]["id"])();
	}
}

