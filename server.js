const express = require('express')
const bearerToken = require('express-bearer-token')
const fetch = require("node-fetch")
const cors = require('cors')
const axios = require('axios');
const app = express()

app.use(cors())
app.use(bearerToken());

app.get("/configuration", async (req, res) => {

    axios({
        method: 'get',
        url: 'https://demo-api.true-bar.si/api/client/configuration',
        headers: {Authorization: `Bearer ` + req.query["token"]},
      })
        .then(function (response) {
            console.log(response.data)
            res.json(response.data)
        })
        .catch(function (error) {
            console.log(error.message)
            res.json()
          });
})


app.listen(3001, () => {
    console.log("Listening on port 3001")
})
