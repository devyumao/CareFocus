var targets;
if (localStorage.getItem("targets") !== null) {
	notifAmount = $.evalJSON(localStorage.getItem("targets")); 	
} else {
	targets = {};
}

$(document).ready(function() {

	$("#btn-add").click(function() {
		$("#modal-add-target input").val("");
	});

	$("#modal-add-target .confirm").click(function() {
		var inputVal = $("#modal-add-target input").val();
		if (inputVal === "") {
		} else {
			var keys = [];
			for (var key in targets) {
				keys.push(parseInt(key));
			}
			var id;
			if (keys.length !== 0) {
				id = Math.max.apply(null,keys) + 1;
			} else {
				id = 1;
			}	
			targets[id] = { "mark": inputVal };
			alert($.toJSON(targets));
			//localStorage.setItem("targets", $.toString(targets));
			$('#modal-add-target').modal('hide');
		}
	});

	var targetInfo;

	$(".social-btn-first").click(function() {
		$('#friend-inputor').val("");
		$("#selected-friend-avatar").attr("src", "");
		$("#selected-friend-name").text("");
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
								targetInfo = data;
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

/*
	$("#target-modal-confirm").click(function(){
		var keys = [];
		for (var key in targets) {
			keys.push(parseInt(key));
		}
		var id = Math.max.apply(null,keys);
		targets[id] = {
			mark: 
		}	
	});
*/
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