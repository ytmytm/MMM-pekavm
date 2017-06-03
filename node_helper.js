
//process.binding('http_parser').HTTPParser = require('http-parser-js').HTTPParser;

const request = require('request');
const NodeHelper = require("node_helper");

var mm_kvv_up_detected = false; //whether some other module e.g. Pir ever has sent USER_PRESENCE Event
var mm_kvv_upresent = true; //current status of user presence

module.exports = NodeHelper.create({

    start: function() {
        console.log("Starting node helper for: " + this.name);
    },

	/* getParams
	 * Generates an url with api parameters based on the config.
	 *
	 * return String - URL params.
	 */
	
	getParams: function(method) {
			var param = "";
			switch (method) {
				case "getServerTime":
					param = ""; break;
				case "getStopPoints":
				case "getStreets":
				case "getLines":
					param = "pattern"; break;
				case "getBollardsByStopPoint":
				case "getBollardsByLine":
				case "getTimesForAllBollards":
					param = "name"; break;
				case "getTimes":
				case "findMessagesForBollard":
					param = "symbol"; break;
			}
			var params = {
				url: this.config.apiBase,
				form: {
					method:method,
					p0:'{"'+param+'":"'+this.config.stopID+'"}'
				}
			};
			return params;
	},
	
    	socketNotificationReceived: function(notification, payload) {
        	if (notification === 'CONFIG') {
            		this.config = payload;
	   		this.getData("getTimes",this.config.stopID);
			if (this.config.showMessages) {
				this.getData("findMessagesForBollard",this.config.stopID);
			}
        	}
		if (notification === 'USER_PRESENCE') {
 			mm_kvv_up_detected = true;
 			mm_kvv_upresent = payload;
 		}
    	},

    	getData: function(option,stopID) {
		if (!mm_kvv_up_detected || mm_kvv_upresent) { // do anything only if user is present
		var x = request.post(this.getParams(option), (error, response, body) => {
		if (typeof response !== 'undefined') {
	        if (response.statusCode === 200) {
			var res = JSON.parse(body);
			switch (option) {
			case "getTimes":
				if (typeof res.success !== 'undefined') {
					this.sendSocketNotification("TRAMS" + stopID, res.success);
				} else {
					this.sendSocketNotification("TRAMSFAIL" + stopID, res);
				}
				break;
			case "findMessagesForBollard":
				if ((typeof res.success !== 'undefined') && (typeof res.success[0] !== 'undefined')) {
					if (typeof res.success[0].content !== 'undefined') {
						if (res.success[0].content.length>0) {
							this.sendSocketNotification("TRAMMSG"+stopID, res.success[0].content);
//demodata body = '{"success":[{"content":"INFO: Od piątku 2.06 od godz. 20:00 do niedzieli 4.06 nastąpi wstrzymanie ruchu tramwajowego na Alejach Marcinkowskiego. Zmianie ulegną trasy linii nr 2, 5, 9, 13, 16 oraz 201. Szczegóły na stronie  <a href=\\"http://utn.pl/i6m0b\\">www.ztm.poznan.pl<\\/a>.","startDate":"2017-06-01T13:00:00.000Z","stopsGroups":[],"startHour":780,"endDate":"2017-06-04T23:45:00.000Z","endHour":1425}]}'
						}
					}
				}
				break;
			}
			//console.log(body);
		} else {
                	console.log("Error getting connections " + response.statusCode);
            	}
		} else {
			console.log("Peka response undefined");
			console.log(x);
			console.log(error);
		}})};
    	}
});

