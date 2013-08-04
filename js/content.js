var renrenCode = window.location.search.split("=")[1];

chrome.extension.sendRequest({key: 'renrenCode', value: renrenCode});