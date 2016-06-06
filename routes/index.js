var request = require('request');
var _ = require('lodash');
var bsApiUrl = 'https://api.biostar2.com/v1'; //Constant

module.exports = function(app) {
	var jar = request.jar();

	// AUTH
	app.post('/login', function(req, res) {
		var loginOpts = {
			url: bsApiUrl + '/login',
			method: 'POST',
			headers: {
				'Content-Type': "application/json;charset=utf-8"
			},
			body: JSON.stringify(req.body)
		};

		request(loginOpts, function(err, loginRes, loginResBody) {
			if (err) {
				res.status(500).send({ err: err });
				return;
			}

			var cookie = loginRes.headers['set-cookie'][0];
			cookie = request.cookie(cookie);
			jar.setCookie(cookie, bsApiUrl);

			res.status(200).send(JSON.parse(loginResBody));
		});
	});

	// VISITORS
	app.get('/visitors', function(req, res) {
		var getVisitorsOpts = {
			url: bsApiUrl + '/users?group_id=1004',
			method: 'GET',
			headers: {
				'Content-Type': "application/json;charset=utf-8"
			},
			jar: jar
		};

		request(getVisitorsOpts, function(bsUsrError, bsUsrRes, bsUsrResBody) {

			if (bsUsrError) {
				res.status(500).send({ err: bsUsrError });
				return;
			}

			var visitors = JSON.parse(bsUsrResBody).records;

			var fromDate = new Date();
			fromDate.setHours(8)
			fromDate.setMinutes(0);
			fromDate.setSeconds(0);

			var toDate = new Date();
			toDate.setHours(20)
			toDate.setMinutes(0);
			toDate.setSeconds(0);

			var body = {
				datetime: [
					fromDate.toISOString(),
					toDate.toISOString()
				],
				device_id: ["539552303"],
				event_type_code: [
					"4102" //Constant
				]
			};
			var bodyStr = JSON.stringify(body);

			var getLogsOpts = {
				url: bsApiUrl + '/monitoring/event_log/search_more',
				method: 'POST',
				headers: {
					'Content-Length': bodyStr.length,
					'Content-Type': "application/json;charset=utf-8"
				},
				body: bodyStr,
				jar: jar
			};
			request(getLogsOpts, function(bsLogsError, bsLogsRes, bsLogsResBody) {
				if (bsLogsError) {
					res.status(500).send({ err: bsLogsError });
					return;
				}

				var logs = JSON.parse(bsLogsResBody).records;

				var todayVisits = {};

				var todayVisitors = _.differenceWith(visitors, logs, function(visitor, log) {
					var isTodayVisitor = visitor.user_id == log.user.user_id;

					if (isTodayVisitor) {
						todayVisits[visitor.user_id] = todayVisits[visitor.user_id] ? todayVisits[visitor.user_id] + 1 : 1;
					}

					return !isTodayVisitor;
				});

				_.forEach(visitors, function(visitor) {
					visitor.present = todayVisits[visitor.user_id] === 1;
				});

				res.status(200).send({ message: 'getVistiors success', visitors: visitors });
			});
		});
	});

	app.post('/visitors', function(req, res) {
		var createVisitorDefaults = {
			security_level: 0,
			status: 'ACT',
			user_group: {
				id: '1004'
			}
		};

		var body = _.defaultsDeep(req.body, createVisitorDefaults);
		var bodyStr = JSON.stringify(body);

		var createVisitorOpts = {
			url: bsApiUrl + '/users',
			method: 'POST',
			headers: {
				'Content-Length': bodyStr.length,
				'Content-Type': "application/json;charset=utf-8"
			},
			body: bodyStr,
			jar: jar
		};

		request(createVisitorOpts, function(err, visitorRes, visitorResBodyStr) {
			if (err) {
				res.status(500).send({ err: err });
				return;
			}

			var response = JSON.parse(visitorResBodyStr);

			if (response.message) {
				res.status(500).send(response);
				return;
			}

			res.status(200).send(response)
		});
	});

	app.put('/visitors', function(req, res) {
		var updateVisitorDefaults = {
			status: 'ACT'
		};

		var body = _.defaultsDeep(req.body, updateVisitorDefaults);
		var bodyStr = JSON.stringify(body);

		var updateVisitorOpts = {
			url: bsApiUrl + '/users/' + body.user_id,
			method: 'PUT',
			headers: {
				'Content-Length': bodyStr.length,
				'Content-Type': "application/json;charset=utf-8"
			},
			body: bodyStr,
			jar: jar
		};

		request(updateVisitorOpts, function(err, visitorRes, visitorResBodyStr) {
			if (err) {
				res.status(500).send({ err: err });
				return;
			}

			var response = JSON.parse(visitorResBodyStr);

			if (response.message) {
				res.status(500).send(response);
				return;
			}

			res.status(200).send(response)
		});
	});

	app.delete('/visitors', function(req, res) {
		var deleteVisitorOpts = {
			url: bsApiUrl + '/users/' + req.body.user_id,
			method: 'DELETE',
			headers: {
				'Content-Type': "application/json;charset=utf-8"
			},
			jar: jar
		};

		request(deleteVisitorOpts, function(err, deleteRes, deleteResBodyStr) {
			if (err) {
				res.status(500).send({ err: err });
				return;
			}

			var response = JSON.parse(deleteResBodyStr);
			if (response.message) {
				res.status(500).send(response);
				return;
			}

			res.status(200).send(response);
		});
	});

	app.post('/visitors/exit', function(req, res) {
		var updateVisitorDefaults = {
			status: 'IN',
			cards: []
		};

		var body = _.defaultsDeep(req.body, updateVisitorDefaults);
		var bodyStr = JSON.stringify(body);

		var updateVisitorOpts = {
			url: bsApiUrl + '/users/' + body.user_id,
			method: 'PUT',
			headers: {
				'Content-Length': bodyStr.length,
				'Content-Type': "application/json;charset=utf-8"
			},
			body: bodyStr,
			jar: jar
		};

		request(updateVisitorOpts, function(err, visitorRes, visitorResBodyStr) {
			if (err) {
				res.status(500).send({ err: err });
				return;
			}

			var response = JSON.parse(visitorResBodyStr);

			if (response.message) {
				res.status(500).send(response);
				return;
			}

			res.status(200).send(response)
		});
	});

	// CARDS
	app.post('/cards/scan', function(req, res) {
		var scanCardOpts = {
			url: bsApiUrl + '/devices/' + req.body.device_id + '/scan_card',
			method: 'POST',
			headers: {
				'Content-Type': "application/json;charset=utf-8"
			},
			jar: jar
		};

		request(scanCardOpts, function(err, scanRes, scanResBodyStr) {
			if (err) {
				res.status(500).send({ err: err });
				return;
			}

			var response = JSON.parse(scanResBodyStr);
			if (response.message) {
				res.status(500).send(response);
				return;
			}

			res.status(200).send(response);
		});
	});
};