'use strict';

var express = require('express');
var app = express();
var axios = require('axios');

var API_URL = 'https://api.unsplash.com/search/photos';
var UTM = '?utm_source=ninjazim-FCC-image-search-API&utm_medium=referral&utm_campaign=api-credit'
var jsonbin_config = {
  headers: {
    "secret-key": "$2a$10$pMBhxkibw/8b2i3ouMSKdeZAC9uq.izTRZO7e3Eq5ogkBvMGhraGO",
    "Content-Type": "application/json"
  }
};


app.use('/public', express.static(process.cwd() + '/public'));

app.route('/api/imagesearch/recent').get((req, res) => {
  var data;
  console.log("recent");
  axios.get('http://api.jsonbin.io/b/' + process.env.JSONBIN + '/latest', jsonbin_config)
      .then(response => {
        data = response.data;
        var recent = data.slice(0,10);
        res.json(recent);
      }).catch(error => {
        console.log(error);
        res.json({error});
      });
});

app.route('/api/imagesearch/:query').get((req, res) => {
    var data, page;
    var result = {
      query: null,
      page: null,
      images: []
    };
    var query = req.params.query;
    var offset = req.query.offset;
    if (offset >= 0) {
      page = '&page=' + offset;
    } else {
      offset = 1;
      page = '&page=1';
    }

    axios.get(API_URL + '?client_id=' + process.env.APP_ID + '&query=' + query + page)
      .then(response => {
        data = response.data;
        data.results.forEach((img) => {
          result.images.push({
            image: "https://unsplash.com/photos/" + img.id + UTM,
            source: img.urls.full + UTM,
            description: img.description
          });
        });
        result.query = query;
        result.page = offset + " of " + data.total_pages;
        updateRecent(query);
        res.json({result});
      }).catch(error => {
        res.json({error});
      });
  });

app.route('/')
    .get(function(req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
  });

app.listen(process.env.PORT, function () {
  console.log('Node.js listening ...');
});


function updateRecent(query) {
  var data;
  console.log("entered updateRecent");
  axios.get('http://api.jsonbin.io/b/' + process.env.JSONBIN + '/latest', jsonbin_config)
    .then(response => {
      data = response.data;
      data.splice(0,0,{
          query: query,
          date: new Date().toUTCString()
        });
      data = JSON.stringify(data);
      axios.put('http://api.jsonbin.io/b/' + process.env.JSONBIN, data, jsonbin_config)
        .then(response => {
          console.log('data posted');
        }).catch(error => {
          console.log(error);
        });
    }).catch(error => {
      console.log(error);
    });
}