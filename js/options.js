var weiboAppKey = "82966982";

var renrenApiKey = "6c094cc7a9634012825a8fddd92dddec";
var renrenRedirectUri = "http://graph.renren.com/oauth/login_success.html";
var renrenAccessToken = (localStorage.getItem("renrenAccessToken") !== null) ? localStorage.getItem("renrenAccessToken") : "";

var siteURL = {
	"weibo": "http://weibo.com/",
	"renren": "http://www.renren.com/"
};

var targets;
if (localStorage.getItem("targets") !== null) {
	targets = $.evalJSON(localStorage.getItem("targets"));	
}

var backgroundPage = chrome.extension.getBackgroundPage();

var $currTargetWrapper,
	currId,
	selectedTarget;

var socialNetworks = ["weibo", "renren", "douban"];

var targetHTML = '<div class="col-2 target-wrapper">'
	+	'<div class="panel">'
	+		'<div class="panel-heading">'
	+			'<span class="target-mark"></span>'
	+			'<span class="glyphicon glyphicon-remove-sign" href="#modal-remove-target" data-toggle="modal"></span>'
	+			'<span class="glyphicon glyphicon-edit" href="#modal-edit-target" data-toggle="modal"></span>'
	+		'</div>'
	+		'<div class="target-avatar-block">'
	+	  		'<img class="target-avatar" />'
	+	  	'</div>'
	+  		'<div class="target-social-btns">'
	+  			'<a href="#modal-weibo" class="btn-weibo" data-toggle="modal"><img src="img/weibo.png" /></a>'
	+  			'<a href="#modal-renren" class="btn-renren" data-toggle="modal"><img src="img/renren.png" /></a>'
	+			'<a href="#modal-douban" class="btn-douban" data-toggle="modal"><img src="img/douban.png" /></a>'
	+  		'</div>'
	+	'</div>'
	+ '</div>';


$(document).ready(function() {
	var originKeys = getKeysFromObject(targets).sort();
	var $rowTargets = $(".row-targets");

	for (var i = 0; i < originKeys.length; i++) {
		$rowTargets.append(targetHTML);
		var $wrapper = $(".target-wrapper").eq(i);
		var key = originKeys[i];
		$wrapper.attr("id", "t"+key);
		$wrapper.find(".target-mark").text(targets[key]["mark"]);
		
		if (targets[key]["avatarType"] === "weibo") {
			$wrapper.find(".target-avatar").attr("src", targets[key]["weibo"]["avatar"]);
		}

		for (var j = 0; j < socialNetworks.length; j++) {
			var social = socialNetworks[j];
			if (typeof targets[key][social] !== "undefined") {
				$(".btn-"+social+" img").css("-webkit-filter", "grayscale(0%)");
			}
		}


	}
});


// glyphicons hover
$(document).on({
	mouseenter: function() {
		$(this).css("opacity", "0.8");
	},
	mouseleave: function() {
		$(this).css("opacity", "0.5");
	}
}, ".panel-heading .glyphicon");


// panel hover
$(document).on({
	mouseenter: function() {
		$(this).find(".panel-heading .glyphicon").stop(true, true).show("fast");
	},
	mouseleave: function() {
		$(this).find(".panel-heading .glyphicon").stop(true, true).hide("fast");
	}
}, ".target-wrapper .panel");

// REMOVE icon click
$(document).on("click", ".panel-heading .glyphicon-remove-sign", function() {
	$currTargetWrapper = $(this).parents(".target-wrapper");
	currId = $currTargetWrapper.attr("id").substr(1); 
	$("#modal-remove-target .modal-body span").text(" "+targets[currId]["mark"]+" ");
});

// REMOVE modal confirm
$(document).on("click", "#modal-remove-target .confirm", function() {
	// var isReloadNeeded = (typeof targets[currId]["weibo"] !== "undefined") ? true : false;

	delete targets[currId];
	localStorage.setItem("targets", $.toJSON(targets));

	var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
	var notifAmount = parseInt(localStorage.getItem("notifAmount") - getCountFromeObject(unreadStatuses[currId]));
	localStorage.setItem("notifAmount", notifAmount);
	chrome.browserAction.setBadgeText({text: (notifAmount > 0) ? "" + notifAmount : ""});

	delete unreadStatuses[currId];
	localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));

	var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
	delete checkPoint[currId];
	localStorage.setItem("checkPoint", $.toJSON(checkPoint));

	/*if (isReloadNeeded) {
		backgroundPage.location.reload();
	}*/
	backgroundPage.location.reload();

	$currTargetWrapper.remove(); 	

	$("#modal-remove-target").modal('hide');
});

// EDIT icon click
$(document).on("click", ".panel-heading .glyphicon-edit", function() {
	$currTargetWrapper = $(this).parents(".target-wrapper");
	currId = $currTargetWrapper.attr("id").substr(1); 
	$("#modal-edit-target .modal-body input").val(targets[currId]["mark"]);
});

// EDIT and ADD modal shown
$(document).on("shown.bs.modal", "#modal-edit-target, #modal-add-target", function() {
	$(this).find(".modal-body input").focus();
});

// EDIT modal confirm
$(document).on("click", "#modal-edit-target .confirm", function() {
	confirmEditTarget();
});

$(document).on("keypress", "#modal-edit-target .modal-body input", function(e) {
	if (e.keyCode === 13) {
		confirmEditTarget();
	}
});

function confirmEditTarget() {
	var inputVal = $.trim($("#modal-edit-target input").val());
	if (inputVal === "") {

	} else if (inputVal === targets[currId]["mark"]) {
		$('#modal-edit-target').modal('hide');
	} else if ($.inArray(inputVal, getMarksFromTargets(targets)) !== -1) {

	} else {
		targets[currId]["mark"] = inputVal;
		localStorage.setItem("targets", $.toJSON(targets));
		$currTargetWrapper.find(".target-mark").text(targets[currId]["mark"]);

		$('#modal-edit-target').modal('hide');
	}
}

// ADD button click
$(document).on("click", "#btn-add", function() {
	$("#modal-add-target input").val("");
});

// ADD modal confirm
$(document).on("click", "#modal-add-target .confirm", function() {
	confirmAddTarget();
});

$(document).on("keypress", "#modal-add-target .modal-body input", function(e) {
	if (e.keyCode === 13) {
		confirmAddTarget();
	}
});

function confirmAddTarget() {
	var inputVal = $.trim($("#modal-add-target input").val());
	if (inputVal === "") {

	} else if ($.inArray(inputVal, getMarksFromTargets(targets)) !== -1) {

	} else {
		var keys = getKeysFromObject(targets);
		var id;
		if (keys.length !== 0) {
			id = Math.max.apply(null,keys) + 1;
		} else {
			id = 1;
		}	
		targets[id] = { 
			"mark": inputVal,
			"avatarType": "" 
		};
		var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
		unreadStatuses[id] = {};
		var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
		checkPoint[id] = {}
		localStorage.setItem("targets", $.toJSON(targets));
		localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));
		localStorage.setItem("checkPoint", $.toJSON(checkPoint));

		$(".row-targets").append(targetHTML);
		var currNum = getCountFromeObject(targets) - 1;
		var $wrapper = $(".target-wrapper").eq(currNum);
		$wrapper.attr("id", "t"+id);
		$wrapper.find(".target-mark").text(targets[id]["mark"]);

		$('#modal-add-target').modal('hide');
	}
}

// WEIBO button click
$(document).on("click", ".btn-weibo", function() {
	var $modalWeibo = $("#modal-weibo");
	var $friendInputor = $modalWeibo.find(".friend-inputor");
	var $friendAvatar = $modalWeibo.find(".selected-friend-avatar");
	var $friendName = $modalWeibo.find(".selected-friend-name a");
	$modalWeibo.find(".alert").hide();
	$friendInputor.val("");
	$friendAvatar.attr("src", "");
	$friendName.text("");
	$friendName.attr("href", "");
	$currTargetWrapper = $(this).parents(".target-wrapper");
	/* remember to set a condition "undefined" for data.uid */
	$.ajax({
		url: "https://api.weibo.com/2/account/get_uid.json?source="+weiboAppKey,
		type: "GET",
		dataType: "json",
		success: function(data) {
			var uid = data.uid,
				screenNames = [];
			getAllScreenNames(uid, screenNames, 0);
			$friendInputor.typeahead({
				source: screenNames,
				updater: function(item) {
					$.ajax({
						url: "https://api.weibo.com/2/users/show.json?source="+weiboAppKey+"&screen_name="+item,
						type: "GET",
						dataType: "json",
						success: function(data) {
							$friendAvatar.attr("src", data.avatar_large);
							$friendName.text(item);
							$friendName.attr("href", siteURL["weibo"] + "u/" + data.id);
							selectedTarget = data;
						},
						error: function(data) {
							alert("Show Ajax Error");
						}
					});
					return item;
				}
			});
		},
		error: function() {
			$modalWeibo.find(".alert").show();
		}
	});
});

// RENREN button click
$(document).on("click", ".btn-renren", function() {
	var $modalRenren = $("#modal-renren");
	$modalRenren.find(".friend-inputor").val("");
	$modalRenren.find(".selected-friend-avatar").attr("src", "");
	$modalRenren.find(".selected-friend-name").text("");
	$currTargetWrapper = $(this).parents(".target-wrapper");
	/* remember to set a condition "undefined" for data.uid */
	$.ajax({
		url: "https://api.renren.com/v2/user/login/get?access_token="+renrenAccessToken,
		type: "GET",
		dataType: "json",
		success: function(data) {
			var uid = data.response.id,
				friends = [];

			getRenrenFriends(uid, friends, 1);
		},
		error: function(data) {
			alert("LoginGet Ajax Error");
		}
	});
});


// WEIBO modal confirm
$(document).on("click", "#modal-weibo .confirm", function() {
	var id = $currTargetWrapper.attr("id").substr(1);
	/* information display condition */
	if ($("#modal-weibo .selected-friend-name").text() !== "") {
		targets[id]["weibo"] = {
			"id": selectedTarget.id,
			"name": selectedTarget.screen_name,
			"avatar": selectedTarget.avatar_large
		};
		targets[id]["avatarType"] = "weibo";

		var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
		checkPoint[id]["weibo"] = "";
		localStorage.setItem("targets", $.toJSON(targets));
		localStorage.setItem("checkPoint", $.toJSON(checkPoint));
		backgroundPage.location.reload();

		$currTargetWrapper.find(".target-avatar").attr("src", targets[id]["weibo"]["avatar"]);
		$currTargetWrapper.find(".btn-weibo img").css("-webkit-filter", "grayscale(0%)");

		$("#modal-weibo").modal("hide");
	} else {

	}
});

// WEIBO modal confirm
$(document).on("click", "#modal-renren .confirm", function() {
	var id = $currTargetWrapper.attr("id").substr(1);
	/* information display condition */
	if ($("#modal-renren .selected-friend-name").text() !== "") {
		targets[id]["renren"] = {
			"id": selectedTarget.id,
			"name": selectedTarget.name,
			"avatar": selectedTarget.avatar
		};
		var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
		checkPoint[id]["renren"] = "";
		checkPoint[id]["renrenSimple"] = "";
		localStorage.setItem("targets", $.toJSON(targets));
		localStorage.setItem("checkPoint", $.toJSON(checkPoint));
		backgroundPage.location.reload();

		$currTargetWrapper.find(".target-avatar").attr("src", targets[id]["renren"]["avatar_large"]);

		$("#modal-renren").modal("hide");
	} else {

	}
});

$(document).on("click", ".alert-link", function() {
	$(this).parents(".modal").modal('hide');
});

$(document).on("click", "#modal-renren .oauth", function() {
	window.open("https://graph.renren.com/oauth/authorize?client_id="+renrenApiKey+"&redirect_uri="+renrenRedirectUri+"&response_type=code&scope=read_user_feed+read_user_status+read_user_share+read_user_album");
});

function getAllScreenNames(uid, screenNames, cursor) {
	$.ajax({
		url: "https://api.weibo.com/2/friendships/friends.json?source="+weiboAppKey+"&uid="+uid+"&count=100&cursor="+cursor,
		type: "GET",
		dataType: "json",
		success: function(data) {
			var len = data.users.length;
			if (0 === len) { 
				$("#modal-weibo .modal-body input").focus();
			} else {
				for (var i = 0; i < len; i++) {
					var user = data.users[i];
					screenNames.push(user.screen_name); 
				}
				getAllScreenNames(uid, screenNames, cursor + 100);
			}
		},
		error: function(data) {
			alert("Friends Ajax Error");
		}
	});
}

function getRenrenFriends(uid, friends, pageNum) {
	$.ajax({
		url: "https://api.renren.com/v2/user/friend/list?access_token="+renrenAccessToken+"&userId="+uid+"&pageSize=100&pageNumber="+pageNum,
		type: "GET",
		dataType: "json",
		success: function(data) {
			if (0 === data.response.length) {
				var names, map;
				var $modalRenren = $("#modal-renren");

				$("#modal-renren .friend-inputor").typeahead({
					source: function(query, process) {
					    names = [];
					    map = {};

					    $.each(friends, function (i, friend) {
					        map[friend.id] = friend;
					        names.push(friend.name+"\t<span>"+friend.id+"</span>");
					    });

					    process(names);
					},

					updater: function(item) {
						var nameAndId = item.split("\t");
						var name = nameAndId[0];
						var id = nameAndId[1].match(/[0-9]+/);

						selectedTarget = map[id];
						$modalRenren.find(".selected-friend-avatar").attr("src", selectedTarget.avatar[2].url);
						$modalRenren.find(".selected-friend-name").text(name);

					    return name;
					}
				});
				$("#modal-renren .modal-body input").focus();
			} else {
				getRenrenFriends(uid, friends.concat(data.response), pageNum + 1);
			}
		},
		error: function(data) {
			alert("FriendList Ajax Error");
		}
	});
}

function getKeysFromObject(obj) {
	var keys = [];
	for (var key in obj) {
		keys.push(parseInt(key));
	}
	return keys;
}

function getCountFromeObject(obj){
	var count = 0;
	for (var key in obj) {
		count++;
	}
	return count;
}

function getMarksFromTargets(targets) {
	var marks = [];
	for (var key in targets) {
		marks.push(targets[key]["mark"]);
	}
	return marks;
}