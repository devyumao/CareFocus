var weiboAppKey = "82966982";

var renrenApiKey = "6c094cc7a9634012825a8fddd92dddec",
	renrenSecretKey = "09a3306b0b0e466b8e06d5bbe15a3369",
	renrenRedirectUri = "http://graph.renren.com/oauth/login_success.html",
	renrenRefreshToken,
	renrenAccessToken;

var doubanApiKey = "013a12dea106488403ae389be312d98c",
	doubanSecretKey = "79a883f3a7a4b184",
	doubanRedirectUri = "http://yuzhang-lille.farbox.com",
	doubanRefreshToken,
	doubanAccessToken;

var audio = new Audio("audio/prompt-tone.wav");

chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
	if (request.key === "renrenCode") {
		$.ajax({
			url: "https://graph.renren.com/oauth/token?grant_type=authorization_code&client_id="+renrenApiKey+"&redirect_uri="+renrenRedirectUri+"&client_secret="+renrenSecretKey+"&code="+request.value,
			type: "GET",
			dataType: "json",
			success: function(data) {
				sendResponse({data: "ok"});
				localStorage.setItem("renrenAccessToken", data.access_token);
				localStorage.setItem("renrenRefreshToken", data.refresh_token);
				window.location.reload();
			},
			error: function(data) {
				sendResponse({data: "ko"});
				console.info("RenrenOauthCode Ajax Error");
			}
		});
	} else if (request.key === "doubanCode") {
		var message = {
			"client_id": doubanApiKey,
			"client_secret": doubanSecretKey,
			"redirect_uri": doubanRedirectUri,
			"grant_type": "authorization_code",
			"code": request.value
		};

		$.ajax({
			url: "https://www.douban.com/service/auth2/token",
			type: "POST",
			data: message,
			dataType: "json",
			success: function(data) {
				sendResponse({data: "ok"});
				localStorage.setItem("doubanAccessToken", data.access_token);
				localStorage.setItem("doubanRefreshToken", data.refresh_token);
				localStorage.setItem("doubanUserId", data.douban_user_id);
				window.location.reload();
			},
			error: function(data) {
				sendResponse({data: "ko"});
				console.info("DoubanOauthCode Ajax Error");
			}
		});
	}
});


if(localStorage.length === 0) {
	localStorage.setItem("notifAmount", "0");
	localStorage.setItem("targets", $.toJSON({}));
	localStorage.setItem("checkPoint", $.toJSON({}));
	localStorage.setItem("unreadStatuses", $.toJSON({}));
	localStorage.setItem("activePane", "");
} else {
	var originNotif = parseInt((localStorage.getItem("notifAmount")));
	if(originNotif > 0) {	
		chrome.browserAction.setBadgeText({text: "" + originNotif});
	} else {
		chrome.browserAction.setBadgeText({text: ""});
	}

	var targets = $.evalJSON(localStorage.getItem("targets"));

	if (localStorage.getItem("renrenRefreshToken") !== null) {
		renrenRefreshToken = localStorage.getItem("renrenRefreshToken");
		$.ajax({
			url: "https://graph.renren.com/oauth/token?grant_type=refresh_token&refresh_token="+renrenRefreshToken+"&client_id="+renrenApiKey+"&client_secret="+renrenSecretKey,
			type: "GET",
			dataType: "json",
			success: function(data) {
				localStorage.setItem("renrenAccessToken", data.access_token);
				renrenAccessToken = data.access_token;
				checkAllStatusesUpdate();
			},
			error: function(data) {
				renrenAccessToken = localStorage.getItem("renrenAccessToken");
				checkAllStatusesUpdate();
				alert("RenrenOauthRefresh Ajax Error");
			}
		});
	} else {
		checkAllStatusesUpdate();
	}
}


function checkAllStatusesUpdate() {
	var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
	var timeout = -1000,
		interval = 1000;

	for (var key in checkPoint) {
		for (var social in checkPoint[key]) {
			var apiURL;
			switch (social) {
				case "weibo":
					apiURL = "https://api.weibo.com/2/statuses/user_timeline.json?source="+weiboAppKey+"&uid="+targets[key][social]["id"]+"&count=10&trim_user=0";
					timeout += interval;
					break;
				case "renren":
					apiURL = "https://api.renren.com/v2/feed/list?access_token="+renrenAccessToken+"&userId="+targets[key][social]["id"]+"&pageSize=10";
					timeout += interval;
					break;
				case "renrenSimple":
					apiURL = "https://api.renren.com/v2/status/list?access_token="+renrenAccessToken+"&ownerId="+targets[key]["renren"]["id"]+"&pageSize=10";
					timeout += interval;
					break;
				case "douban":
					apiURL = "https://api.douban.com/shuo/v2/statuses/user_timeline/"+targets[key]["douban"]["id"]+"?apikey="+doubanApiKey+"&count=10";
					timeout += interval;
				default:
					break;
			}
			console.log(apiURL);
			// setTimeout(checkStatusesUpdate(key, apiURL, social), timeout);
		}
	}
}


function checkStatusesUpdate(key, apiURL, social) {
	return function() {
		$.ajax({
			url: apiURL,
			type: "GET",
			dataType: "json",
			success: function(data) {

				console.log(key + "-" + social + ": " + Date());

				var unreadStatuses, 
					notifAmount;

				var statuses,
					timestamp;
				switch (social) {
					case "weibo":
						statuses = data.statuses;
						timestamp = "created_at";
						break;
					case "renren":
						statuses = data.response;
						timestamp = "time";
						break;
					case "renrenSimple":
						statuses = data.response;
						timestamp = "createTime";
						break;
					case "douban":
						statuses = data;
						timestamp = "created_at";
						break;
					default:
						break;
				}

				var audioPlayNeeded = false;

				var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));

				if (checkPoint[key][social] !== "") {
					// var lastCheckPoint = new Date(checkPoint[key][social]);
					lastCheckPoint = new Date("2005-10-10 23:25:58");

					for (var i = 0; i < statuses.length; i++) {
						var status = statuses[i];

						if ( (social !== "renren") || ((social === "renren") && (status.type !== "UPDATE_STATUS")) ) {
							var createdAt = new Date(status[timestamp]);
							if (createdAt > lastCheckPoint) {
								if(0 === i) {
									checkPoint[key][social] = status[timestamp];
									localStorage.setItem("checkPoint", $.toJSON(checkPoint));	
								}
								unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
								unreadStatuses[key][social+"-"+status.id] = {
									"type": social, 
									"timestamp": status[timestamp], 
									"data": status
								};
								localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));

								notifAmount = parseInt((localStorage.getItem("notifAmount")));
								localStorage.setItem("notifAmount", ++notifAmount);

								audioPlayNeeded = true;
							} else {
								break;
							}
						}
					}
				} else if (typeof statuses[0] !== "undefined") {
					checkPoint[key][social] = statuses[0][timestamp];
					localStorage.setItem("checkPoint", $.toJSON(checkPoint));
				} else {
					checkPoint[key][social] = new Date("2008-3-2 20:00:00");
					localStorage.setItem("checkPoint", $.toJSON(checkPoint));
				}

				if (audioPlayNeeded) {
					audio.play();
				}

				notifAmount = parseInt((localStorage.getItem("notifAmount")));
				if(notifAmount > 0) {
					chrome.browserAction.setBadgeText({text: "" + notifAmount});
				} else {
					chrome.browserAction.setBadgeText({text: ""});
				}	
			},
			error: function(data) {
				console.log("UserTimeLine Ajax Error: " + key + ", " + social);
			}
		});

		// setTimeout(checkStatusesUpdate(key, apiURL, social), 90000);
	};
	
}