const http = require('http');
const url = require('url');
const fs = require('fs');
const qs = require('querystring');

const port = 9001;
http.createServer(function(req, res) {
  var q = url.parse(req.url, true);
  bool = q.pathname.includes("/getSchedule");
  if (q.pathname === '/') {
    indexPage(req, res);
  }
  else if (q.pathname === '/index.html') {
    indexPage(req, res);
  }
  else if (q.pathname === '/schedule.html') {
    schedulePage(res);
  }
  else if (bool) {
    // gets the day
    getSchedulePage(res, q.pathname.split("_")[1])
  }
  else if (q.pathname === "/addEvent.html") {
    addEventPage(res);
  } 
  else if (q.pathname === "/postEventEntry") {
    let body = "";
    req.on('data', function(data) {
      body += data;
    });
    req.on('end', function() {
      postEventEntry(res, body);
    });
  }
  else if (q.pathname === "/eventInterferes") {
    eventInterferes(req, res);
  }
  else {
    res.writeHead(404, { 'Content-Type': 'text/html' });
    return res.end("404 Not Found");
  }
}).listen(port);


function indexPage(req, res) {
  fs.readFile('client/index.html', (err, html) => {
    if (err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
  });
}

function schedulePage(res) {
  fs.readFile('client/schedule.html', (err, html) => {
    if (err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
  });
}

function getSchedulePage(res, inputtedDay) {
  fs.readFile('schedule.json', (err, data) => {
    if (err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'application/json');
    res.write(JSON.stringify((JSON.parse(data))[inputtedDay]));
    res.end();
  });
}

function addEventPage(res) {
  fs.readFile('client/addEvent.html', (err, html) => {
    if (err) {
      throw err;
    }
    res.statusCode = 200;
    res.setHeader('Content-type', 'text/html');
    res.write(html);
    res.end();
  });
}

function postEventEntry(res, body) {
  let obj = qs.parse(body);
  let inputtedJson = {
    "name": obj.event, "start": obj.start, "end": obj.end, "phone": obj.phone, "location": obj.location, "info": obj.info, "url": obj.url
  };

  fs.readFile('schedule.json', (err, data) => {
    if (err) {
      throw err;
    }

    let currJson = JSON.parse(data);
    currJson[obj.day.toLowerCase()].push(inputtedJson);
    currJson[obj.day.toLowerCase()].sort(({start: x}, {start:y}) => x.toString().localeCompare(y.toString()));    
    fs.writeFile("schedule.json", JSON.stringify(currJson), (err, data) => {
      if (err) {
        throw err;
      }
    });
    res.writeHead(302, {'Location': "/schedule.html"});
    res.end();
  });
}


