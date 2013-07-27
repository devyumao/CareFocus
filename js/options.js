var targets,
	unreadStatuses;
if (localStorage.getItem("targets") !== null) {
	targets = $.evalJSON(localStorage.getItem("targets"));
	unreadStatuses = $.evalJSON(localStorage.getItem("unreadStatuses")); 	
} else {
	targets = {};
	unreadStatuses = {};
}

var backgroundPage = chrome.extension.getBackgroundPage();

$(document).ready(function() {

	var selectedTarget,
		$currTargetWrapper;

	var originKeys = getKeysFromObject(targets).sort();

	for (var i = 0; i < originKeys.length; i++) {
		$(".target-wrapper").eq(i).attr("id", "t"+originKeys[i]);
	}

	$("#btn-add").click(function() {
		$("#modal-add-target input").val("");
		$currTargetWrapper = $(this).parents(".target-wrapper");
	});

	$("#modal-add-target .confirm").click(function() {
		var inputVal = $("#modal-add-target input").val();
		if (inputVal === "") {
		} else {
			var keys = getKeysFromObject(targets);
			var id;
			if (keys.length !== 0) {
				id = Math.max.apply(null,keys) + 1;
			} else {
				id = 1;
			}	
			targets[id] = { "mark": inputVal };
			unreadStatuses[id] = [];
			localStorage.setItem("targets", $.toJSON(targets));
			localStorage.setItem("unreadStatuses", $.toJSON(unreadStatuses));
			$currTargetWrapper.attr("id", "t"+id);
			$('#modal-add-target').modal('hide');
		}
	});

	$(".social-btn-first").click(function() {
		$('#friend-inputor').val("");
		$("#selected-friend-avatar").attr("src", "");
		$("#selected-friend-name").text("");
		$currTargetWrapper = $(this).parents(".target-wrapper");
		$.ajax({
			url: "https://api.weibo.com/2/account/get_uid.json?source=5786724301",
			type: "GET",
			dataType: "json",
			success: function(data) {
				var uid = data.uid,
					screenNames = [];
				getAllScreenNames(uid, screenNames, 0);
				$('#friend-inputor').typeahead({
					source: screenNames,
					updater: function(item) {
						$.ajax({
							url: "https://api.weibo.com/2/users/show.json?source=5786724301&screen_name="+item,
							type: "GET",
							dataType: "json",
							success: function(data) {
								$("#selected-friend-avatar").attr("src", data.avatar_large);
								$("#selected-friend-name").text(item);
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


	$("#target-modal .confirm").click(function(){
		var id = $currTargetWrapper.attr("id").substr(1);
		if ($("#selected-friend-name").text() !== "") {
			targets[id]["weibo"] = {
				"id": selectedTarget.id,
				"screen_name": selectedTarget.screen_name,
				"profile_image_url": selectedTarget.profile_image_url,
				"avatar_large": selectedTarget.avatar_large
			};
			localStorage.setItem("targets", $.toJSON(targets));
			backgroundPage.location.reload();
			$('#target-modal').modal('hide');
		} else {

		}
	});

});

function getAllScreenNames(uid, screenNames, cursor) {
	$.ajax({
		url: "https://api.weibo.com/2/friendships/friends.json?source=5786724301&uid="+uid+"&count=100&cursor="+cursor,
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

function getKeysFromObject(obj) {
	var keys = [];
	for (var key in obj) {
		keys.push(parseInt(key));
	}
	return keys;
}