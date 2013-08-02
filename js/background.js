var weiboAppKey = "82966982";

if(localStorage.length === 0) {
	localStorage.setItem("notifAmount", "0");
	localStorage.setItem("targets", $.toJSON({}));
	localStorage.setItem("checkPoint", $.toJSON({}));
	localStorage.setItem("unreadStatuses", $.toJSON({}));
} else {
	var originNotif = parseInt((localStorage.getItem("notifAmount")));
	if(originNotif === 0) {
		chrome.browserAction.setBadgeText({text: ""});
	} else {
		chrome.browserAction.setBadgeText({text: "" + originNotif});
	}

	var targets = $.evalJSON(localStorage.getItem("targets"));
	var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
	for (var key in targets) {
		if(typeof targets[key]["weibo"] !== "undefined") {
			checkWeiboUpdate(key, targets[key]["weibo"]["id"])();
		}
	}
}

function checkWeiboUpdate(key, uid) {
	return function() {
		$.ajax({
			url: "https://api.weibo.com/2/statuses/user_timeline.json?source="+weiboAppKey+"&uid="+uid+"&trim_user=0",
			type: "GET",
			dataType: "json",
			success: function(data) {
				console.log(key + ": " + Date());

				var unreadStatuses, 
					notifAmount;

				if (checkPoint[key]["weibo"] !== "") {
					var lastCheckPoint = new Date(checkPoint[key]["weibo"]);
					for (var i = 0; i < data.statuses.length; i++) {
						var status = data.statuses[i];
						var createdAt = new Date(status.created_at);
						if (createdAt > lastCheckPoint) {
							if(0 === i) {
								checkPoint[key]["weibo"] = status.created_at;
								localStorage.setItem("checkPoint", $.toJSON(checkPoint));	
							}
							unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
							unreadStatuses[key].push({type: "weibo", data: status});
							localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));

							notifAmount = parseInt((localStorage.getItem("notifAmount")));
							localStorage.setItem("notifAmount", ++notifAmount);

						} else {
							break;
						}
					}
				} else if (typeof data.statuses[0] !== "undefined") {
					checkPoint[key]["weibo"] = data.statuses[0].created_at;
					localStorage.setItem("checkPoint", $.toJSON(checkPoint));
				} else {
					checkPoint[key]["weibo"] = new Date();
					localStorage.setItem("checkPoint", $.toJSON(checkPoint));
				}

				notifAmount = parseInt((localStorage.getItem("notifAmount")));
				if(notifAmount === 0) {
					chrome.browserAction.setBadgeText({text: ""});
				} else {
					chrome.browserAction.setBadgeText({text: "" + notifAmount});
				}			
			},
			error: function(data) {
				alert("UserTimeLine Ajax Error");
			}
		});

		setTimeout(checkWeiboUpdate(key, uid), 30000);
	};
	
}