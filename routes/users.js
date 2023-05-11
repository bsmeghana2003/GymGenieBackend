require('dotenv').config();
var express = require('express');
var jwt = require('jsonwebtoken');
var router = express.Router();
const sha256 = require('sha256');

const authenticateUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (token == null) {
    return res.sendStatus(401);
  }

  jwt.verify(token, process.env.ACCESS_SECRET, (err, data) => {
    if (err) {
      return res.sendStatus(403);
    }
    console.log(data.username);
    req.username = data.username;
    next();
  })
}

router.post('/user/add', function (req, res, next) {
  var name = req.body.name;
  var username = req.body.username;
  var password = req.body.password;
  var height = req.body.height;
  var weight = req.body.weight;
  var collection = req.db.collection("users");
  var dataToInsert = {
    name: name,
    username: username,
    password: sha256(password),
    height: height,
    weight: weight
  };
  collection.insertOne(dataToInsert).then(function (data) {
    if (data) {
      res.send({
        status: "Success",
        data: "User added successfully"
      });
    } else {
      res.send({
        status: "Error",
        err: "Failed to create user"
      });
    }
  })
});


router.post('/user/login', function (req, res, next) {
  var username = req.body.username;
  var password = req.body.password;
  var collection = req.db.collection("users");
  collection.findOne({ username: username, password: sha256(password) }).then(function (data) {
    if (data) {
      var userData = {
        username: username
      };
      const access_token = jwt.sign(userData, process.env.ACCESS_SECRET);
      res.send({
        status: "Success",
        access_token: access_token
      });
    } else {
      res.send({
        status: "Error",
        err: "Wrong credentials"
      });
    }
  });

});

router.get('/workouts', authenticateUser, function (req, res, next) {
  var collection = req.db.collection("workouts");
  collection.find({}).toArray().then(function (data) {
    if (data) {
      res.send({
        status: "Success",
        data: data
      });
    } else {
      res.send({
        status: "Error",
        err: "Wrong credentials"
      });
    }
  });
});

router.get('/user/added/workouts', authenticateUser, function (req, res, next) {
  var collection = req.db.collection("userWorkouts");
  collection.find({ username: req.username }).toArray().then(function (data) {
    if (data) {
      var workout_ids = [];
      data.forEach(each => {
        workout_ids.push(each.workout_id);
      })
      res.send({
        status: "Success",
        data: workout_ids
      });
    } else {
      res.send({
        status: "Error",
        err: "Wrong credentials"
      });
    }
  });
});

router.get('/user/settings', authenticateUser, function (req, res, next) {
  var collection = req.db.collection("users");
  collection.findOne({ username: req.username }).then(function (data) {
    if (data) {
      res.send({
        status: "Success",
        data: data
      });
    } else {
      res.send({
        status: "Error",
        err: "Something went wrong"
      });
    }
  });

});

router.post('/user/update/password', authenticateUser, function (req, res, next) {
  var collection = req.db.collection("users");
  collection.updateOne({ username: req.username }, { $set: { password: sha256(req.body.password) } }).then(function (data) {
    if (data) {
      res.send({
        status: "Success",
        data: "Password updated successfully"
      });
    } else {
      res.send({
        status: "Error",
        err: "Something went wrong"
      });
    }
  });

});

router.post('/user/add/workout', authenticateUser, function (req, res, next) {
  var collection = req.db.collection("userWorkouts");
  var dataToInsert = {
    username: req.username,
    workout_id: req.body.workout_id
  }
  collection.insertOne(dataToInsert).then(function (data) {
    if (data) {
      res.send({
        status: "Success",
        data: "Workout successfully added to profile"
      });
    } else {
      res.send({
        status: "Error",
        err: "Something went wrong"
      });
    }
  });

});

router.post('/user/log/workout', authenticateUser, function (req, res, next) {
  var collection = req.db.collection("loggedWorkouts");
  var dataToInsert = {
    username: req.username,
    workout_id: req.body.workout_id,
    workout_name: req.body.name,
    date: req.body.date,
    duration: req.body.duration,
    KCal: req.body.KCal
  }
  collection.insertOne(dataToInsert).then(function (data) {
    if (data) {
      res.send({
        status: "Success",
        data: "Workout successfully logged"
      });
    } else {
      res.send({
        status: "Error",
        err: "Something went wrong"
      });
    }
  });

});

router.get('/user/workout/log/history', authenticateUser, function (req, res, next) {
  var collection = req.db.collection("loggedWorkouts");

  collection.find({ username: req.username, workout_id: req.query.workout_id }).toArray().then(function (data) {
    if (data) {
      res.send({
        status: "Success",
        data: data
      });
    } else {
      res.send({
        status: "Error",
        err: "Something went wrong"
      });
    }
  });

});

router.get('/user/workouts', authenticateUser, function (req, res, next) {
  var collection = req.db.collection("userWorkouts");
  collection.aggregate(
    [
      {
        $match: { username: req.username }
      },
      {
        $lookup:
        {
          from: "workouts",
          localField: "workout_id",
          foreignField: "workout_id",
          as: "workoutinfo"
        }
      }
    ]
  ).toArray().then(function (data) {
    if (data) {
      console.log(data);
      res.send({
        status: "Success",
        data: data
      });
    } else {
      res.send({
        status: "Error",
        err: "Something went wrong"
      });
    }
  });

});

module.exports = router;
