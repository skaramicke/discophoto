const path = require("path");
const express = require("express");
const app = express();
const http = require("http");
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const fs = require("fs");

const port = 3000;
const imagesPath = path.join(__dirname, '..', 'images');

const broadcastImages = (socket = null) => {
  fs.readdir(imagesPath, (err, files) => {
    let images = []; 
    if (err) {
      console.log(err);
    } else {
      files.forEach(file => {
        if (file.split('.').pop() !== 'jpg' && file.split('.').pop() !== 'png') {
          return;
        }
        images.push(file);
      });
    }

    // Sort images by created timestamp
    images.sort((a, b) => {
      a_created = fs.statSync(`${imagesPath}/${a}`).ctimeMs;
      b_created = fs.statSync(`${imagesPath}/${b}`).ctimeMs;
      return a_created - b_created;
    });

    // Limit to 10x6 images
    images = images.slice(0, 60);

    // Prefix image filenames with the image path
    images = images.map(image => `/image/${image}`);

    if (socket) {
      console.log('Sending images to new client');
      socket.emit('images', images);
    } else {
      console.log('Broadcasting images');
      io.sockets.emit('images', images);
    }
  });
};

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get('/image/:filename', (req, res) => {
  res.sendFile(path.join(imagesPath, req.params.filename));
});

server.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});

io.on("connection", (socket) => {
  console.log("a user connected");
  broadcastImages(socket);
  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

fs.watch(imagesPath, (eventType, filename) => {
  console.log('Image changes detected');
  broadcastImages();
});