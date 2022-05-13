const express = require('express');
     
// app.use(express.json());
bodyParser = require('body-parser');
uuid = require('uuid');

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));



// import built in node modules fs and path 
const morgan = require('morgan');
      fs = require('fs'), 
      path = require('path');

      mongoose = require('mongoose');
      Models = require ('./models');

//mongoose models
const Movies = Models.Movie;
const Users = Models.User;
const Genres = Models.Genre;
const Directors = Models.Director;

//connection with Mongo database
mongoose.connect('mongodb://localhost:27017/myFlixDb', { 
useNewUrlParser: true, 
useUnifiedTopology: true,
});

//setting up logging stream with log.txt
const accessLogStream = fs.createWriteStream(path.join(__dirname, 'log.txt'), 
{flags: 'a'});

//logging with morgan
app.use(morgan('combined', { stream: accessLogStream }));

// serve static file
app.use(express.static('public'));

  //ADDING ENDPOINDS FOR OUR API

  //Allow new user creation with post method
  app.post ('/users', (req, res) => {
     Users.findOne({ Username: req.body.Username })
     .then ((user) => {
         if (user) {
             return res.status(400).send(req.body.Username + ' already exists.');
      } else {
          Users.create({
             Username: req.body.Username,
             Password: req.body.Password,
             Email: req.body.Email,
             Birthday: req.body.Birthday
          })
          .then ((user) => {
              res.status(201).json(user) 
          }).catch((err) => {
              console.error(err);
              res.status(500).send('Error: ' + err);
          })
      }
     }).catch((err) => {
         console.error(err);
         res.status(500).send('Error: ' + err);
     });
  });

  //GET ALL USERS
  app.get('/users', (req,res) => {
      Users.find()
      .then((users) => {
          res.status(201).json(users);
      })
      .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
      });
  });

  //get a user by Username
  app.get('/users/:Username', (req, res) => {
      Users.findOne({ Username: req.params.Username })
         .then((user) => {
           res.json(user);
      })
      .catch((err) => {
          console.error(err);
          res.status(500).send('Error: ' + err);
      });
  });


  // Update user's details as Password
  app.put('/users/:Username', (req, res) => {
      Users.findOneAndUpdate ({ Password: req.params.Password }, {$set:
          {
              Username: req.body.Username,
              Password: req.body.Password,
              Email: req.body.Email,
              Birthday: req.body.Birthday
          }
      },
      { new: true }, // This line makes sure that the updated document is returned
      (err, updatedUser) => {
          if(err) {
              console.error(err);
              res.status(500).send('Error: ' + err);
          } else {
              res.json(updatedUser);
          }
      });
  });

  //users to add a movie to their list of favorites
  app.post('/users/:Username/movies/:MovieID', (req, res) => {     
      Users.findOneAndUpdate({ Username: req.params.Username },
          {
              $push: { favoriteMovies: req.params.MovieID }
          },
          { new: true},
          (err, updatedUser) => {
              if (err) {
                  console.error(err);
                  res.status(500).send('Error: ' + err);
              } else {
                  res.json(updatedUser);
              }
          });
  });

  //User delete movie from fav list
  app.delete('/users/:Username/favouriteMovie/:movieID', (req, res) => {
      Users.findOneAndUpdate({ Username: req.params.Username },
          { $pull: { favoriteMovies: req.params.movieID} 
      })
    .then((updatedUser) => {
        Movies.findOne({ _id: req.params.movieID }).then((movie) => {
         res.send('The movie \'' + movie.Title + '\' has been successfully removed from your list of favourites.');
  })
  }) .catch((err) => {
      console.error(err);
      res.status(500).send('Error: ' + err);
    });

  //User deleted from api
  app.delete('/users/:Username', (req, res) => {
      Users.findOneAndRemove({ Username: req.params.Username })
          .then((user) => {
              if (!user) {
                  res.status(400).send(req.params.Username + ' has not been found.');
              } else {
                  res.status(200).send(req.params.Username + ' has been deleted.');
              }
          })
          .catch((err) => {
              console.error(err);
              res.status(500).send('Error: ' + err);
          });
  });
});

  //Read functions for MOVIES

  // GET requests
  app.get('/', (req, res) => {
      res.send('Welcome to my list of movies!');
  });
  
  //Return a list of ALL movies
  app.get('/movies',(req, res) => {
      Movies.find()
      .then((movies)  => {
          res.status(201).json(movies);
      })
      .catch((error) => {
          console.error(error);
          res.status(500).send('Error: ' + error);
      });
  });

  // Single movie by title
  app.get('/movies/:Title', (req, res) => {
      Movies.find({ Title: req.params.Title }) 
      .then(movie => {
          console.log('You are searching for a movie named ' + req.params.Title);
          if (Object.keys(movie).lenght != 0) 
          res.json(movie)
          else {res.status(400).send(req.params.Title + ' does not exist in our library.')}
      })
      .catch((err) => res.status(500));
  });
         

 // Return data about a genre (description) by name/title
 app.get('/movies/genre/:Name', (req, res) => {
     Movies.findOne({ genreName: req.params.genreName})
     .then(movie => {
         Genres.findById(movie.Genre)
         .then(genre => {
             res.status(200).json(genre);
         })
         .catch((err) => console.error(err));
 });
 });

 // Directors name
  app.get('/movies/director/:Name', (req, res) => {
      Directors.findOne({ Name: req.params.Name })
      .then((director) => { res.json(director);
      })
      .catch((err) => console.log(err));
  });

  //returns documentation page from static public folder
  app.get('/documentation', (req, res) => {                  
      res.sendFile(__dirname + '/public/documentation.html');
  });

   // error message always after other instances(get, post,use) but before listen
   app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).send('An error occured, please try again');
  });

  // listen for requests
  app.listen(8080, () => {
      console.log('Your app is listening on port 8080.');
  });