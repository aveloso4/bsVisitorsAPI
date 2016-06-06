var express = require('express');
var bodyParser = require('body-parser');

var app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

var routes = require('./routes')(app);

app.listen(3005, function () {
  console.log('Biostar-Visitors API running on port ' + 3005);
});