var weiboAppKey = "82966982";
var renrenAccessToken = "239309|6.16895ace3b9af802b2c6a13c70dcbfd4.2592000.1378051200-0";

var targets;
if (localStorage.getItem("targets") !== null) {
	targets = $.evalJSON(localStorage.getItem("targets"));	
}

var backgroundPage = chrome.extension.getBackgroundPage();

var $currTargetWrapper,
	currId,
	selectedTarget;

var targetHTML = '<div class="col-lg-2 target-wrapper">'
	+	'<div class="panel">'
	+		'<div class="panel-heading">'
	+			'<span class="target-mark"></span>'
	+			'<span class="glyphicon glyphicon-remove-sign" href="#modal-remove-target" data-toggle="modal"></span>'
	+			'<span class="glyphicon glyphicon-edit" href="#modal-edit-target" data-toggle="modal"></span>'
	+		'</div>'
	+		'<div>'
	+	  		'<img class="target-avatar" />'
	+	  	'</div>'
	+  		'<div class="target-social-btns btn-group">'
	+  			'<a href="#modal-weibo" class="btn btn-default btn-weibo" data-toggle="modal">wb</a>'
	+  			'<a href="#modal-renren" class="btn btn-default btn-renren" data-toggle="modal">rr</a>'
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
		if (typeof targets[key]["weibo"] !== "undefined") {
			$wrapper.find(".target-avatar").attr("src", targets[key]["weibo"]["avatar_large"]);
		}
	}
});

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
	$("#modal-remove-target .modal-body span").text(targets[currId]["mark"]);
});

// REMOVE modal confirm
$(document).on("click", "#modal-remove-target .confirm", function() {
	var isReloadNeeded = (typeof targets[currId]["weibo"] !== "undefined") ? true : false;

	delete targets[currId];
	localStorage.setItem("targets", $.toJSON(targets));

	var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
	var notifAmount = parseInt(localStorage.getItem("notifAmount") - unreadStatuses[currId].length);
	localStorage.setItem("notifAmount", notifAmount);
	chrome.browserAction.setBadgeText({text: (notifAmount === 0) ? "" : "" + notifAmount});

	delete unreadStatuses[currId];
	localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));

	var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
	delete checkPoint[currId];
	localStorage.setItem("checkPoint", $.toJSON(checkPoint));

	if (isReloadNeeded) {
		backgroundPage.location.reload();
	}
	$currTargetWrapper.remove(); 	

	$("#modal-remove-target").modal('hide');
});

// EDIT icon click
$(document).on("click", ".panel-heading .glyphicon-edit", function() {
	$currTargetWrapper = $(this).parents(".target-wrapper");
	currId = $currTargetWrapper.attr("id").substr(1); 
	$("#modal-edit-target .modal-body input").val(targets[currId]["mark"]);
});

// EDIT modal shown
$(document).on("shown.bs.modal", "#modal-edit-target", function() {
	$("#modal-edit-target .modal-body input").focus();
});

// EDIT modal confirm
$(document).on("click", "#modal-edit-target .confirm", function() {
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
});

// ADD button click
$(document).on("click", "#btn-add", function() {
	$("#modal-add-target input").val("");
});

// ADD modal confirm
$(document).on("click", "#modal-add-target .confirm", function() {
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
		targets[id] = { "mark": inputVal };
		var unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses"));
		unreadStatuses[id] = [];
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
});

// WEIBO button click
$(document).on("click", ".btn-weibo", function() {
	var $modalWeibo = $("#modal-weibo");
	var $friendInputor = $modalWeibo.find(".friend-inputor");
	var $friendAvatar = $modalWeibo.find(".selected-friend-avatar");
	var $friendName = $modalWeibo.find(".selected-friend-name");
	$friendInputor.val("");
	$friendAvatar.attr("src", "");
	$friendName.text("");
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
		error: function(data) {
			alert("GetUid Ajax Error");
		}
	});
});

// RENREN button click
$(document).on("click", ".btn-renren", function() {
	var $modal = $("#modal-renren");
	var $friendInputor = $modal.find(".friend-inputor");
	var $friendAvatar = $modal.find(".selected-friend-avatar");
	var $friendName = $modal.find(".selected-friend-name");
	$friendInputor.val("");
	$friendAvatar.attr("src", "");
	$friendName.text("");
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

			$friendInputor.typeahead({
				source: function (query, process) {
				    states = [];
				    map = {};
				 	
				    var data = [
				        {"stateCode": "CA", "stateName": "California"},
				        {"stateCode": "AZ", "stateName": "Arizona"},
				        {"stateCode": "NY", "stateName": "New York"},
				        {"stateCode": "NV", "stateName": "Nevada"},
				        {"stateCode": "OH", "stateName": "Ohio"}
				    ];
				 
				    $.each(data, function (i, state) {
				        map[state.stateName] = state;
				        states.push(state.stateName);
				    });
				 
				    process(states);
				}
			});
			//getAllScreenNames(uid, screenNames, 1);
			/*$friendInputor.typeahead({
				source: screenNames,
				updater: function(item) {
					$.ajax({
						url: "https://api.weibo.com/2/users/show.json?source="+weiboAppKey+"&screen_name="+item,
						type: "GET",
						dataType: "json",
						success: function(data) {
							$friendAvatar.attr("src", data.avatar_large);
							$friendName.text(item);
							selectedTarget = data;
						},
						error: function(data) {
							alert("Show Ajax Error");
						}
					});
					return item;
				}
			});*/
		},
		error: function(data) {
			alert("LoginGet Ajax Error");
		}
	});
});


// social confirm
$(document).on("click", "#modal-weibo .confirm", function() {
	var id = $currTargetWrapper.attr("id").substr(1);
	/* information display condition */
	if ($.trim($("#modal-weibo .selected-friend-name").text()) !== "") {
		targets[id]["weibo"] = {
			"id": selectedTarget.id,
			"screen_name": selectedTarget.screen_name,
			"profile_image_url": selectedTarget.profile_image_url,
			"avatar_large": selectedTarget.avatar_large
		};
		var checkPoint = $.evalJSON(localStorage.getItem("checkPoint"));
		checkPoint[id]["weibo"] = "";
		localStorage.setItem("targets", $.toJSON(targets));
		localStorage.setItem("checkPoint", $.toJSON(checkPoint));
		backgroundPage.location.reload();

		$currTargetWrapper.find(".target-avatar").attr("src", targets[id]["weibo"]["avatar_large"]);

		$('#modal-weibo').modal('hide');
	} else {

	}
});


function getAllScreenNames(uid, screenNames, cursor) {
	$.ajax({
		url: "https://api.weibo.com/2/friendships/friends.json?source="+weiboAppKey+"&uid="+uid+"&count=100&cursor="+cursor,
		type: "GET",
		dataType: "json",
		success: function(data) {
			var len = data.users.length;
			if (0 === len) { 
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
		url: "https://api.renren.com/v2/user/friend/list?access_token="+renrenAccessToken+"&userId="+uid+"&pageSize=100&cpageNumber="+pageNum,
		type: "GET",
		dataType: "json",
		success: function(data) {
			alert("fff");
			var len = data.response.length;
			if (0 === len) { 
				alert(friends.length);
			} else {
				//getRenrenFriends(uid, friends.concat(data.response), pageNum + 1);
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